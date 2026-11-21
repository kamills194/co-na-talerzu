begin;

create table public.cnt_shares (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('favorites','shopping')),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 250 and octet_length(items::text) <= 42000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index cnt_shares_owner_idx on public.cnt_shares(owner, created_at desc);
alter table public.cnt_shares enable row level security;
revoke all on public.cnt_shares from anon, authenticated;
grant select, delete on public.cnt_shares to authenticated;
grant insert (kind,items) on public.cnt_shares to authenticated;
create policy cnt_shares_own_select on public.cnt_shares for select to authenticated using (owner = (select auth.uid()));
create policy cnt_shares_own_create on public.cnt_shares for insert to authenticated with check (owner = (select auth.uid()));
create policy cnt_shares_own_delete on public.cnt_shares for delete to authenticated using (owner = (select auth.uid()));

-- Authenticated recipients with the exact link can fetch only the shared snapshot.
create function public.cnt_read_share(link uuid)
returns table(kind text, items jsonb, expires_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.kind,s.items,s.expires_at from public.cnt_shares s
  where (select auth.uid()) is not null and s.id = link and s.expires_at > now();
$$;
revoke all on function public.cnt_read_share(uuid) from public, anon;
grant execute on function public.cnt_read_share(uuid) to authenticated;

create table public.cnt_submissions (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('recipe','offer')),
  lang text not null check (lang in ('pl','en','de','uk','fr','da','es','it')),
  title text not null check (char_length(btrim(title)) between 3 and 150),
  ingredients text,
  details text not null check (char_length(btrim(details)) between 8 and 4500),
  store text,
  region text,
  price_cents integer,
  valid_until date,
  source text check (source is null or (length(source) <= 500 and source ~ '^https://[^[:space:]<>]+$')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  check (
    (kind='recipe' and ingredients is not null and char_length(btrim(ingredients)) between 4 and 3000
     and store is null and region is null and price_cents is null and valid_until is null)
    or
    (kind='offer' and ingredients is null and store is not null and char_length(btrim(store)) between 2 and 80
     and region is not null and char_length(btrim(region)) between 2 and 100 and price_cents is not null
     and price_cents between 1 and 10000000 and valid_until is not null and source is not null)
  )
);
create index cnt_submissions_author_idx on public.cnt_submissions(author, created_at desc);
create index cnt_submissions_public_idx on public.cnt_submissions(lang,kind,created_at desc) where status = 'approved';
alter table public.cnt_submissions enable row level security;
revoke all on public.cnt_submissions from anon, authenticated;
grant select (id,kind,lang,title,ingredients,details,store,region,price_cents,valid_until,source,status,created_at) on public.cnt_submissions to authenticated;
grant insert (kind,lang,title,ingredients,details,store,region,price_cents,valid_until,source) on public.cnt_submissions to authenticated;
grant delete on public.cnt_submissions to authenticated;
create policy cnt_submissions_read on public.cnt_submissions for select to authenticated
  using (author = (select auth.uid()) or status = 'approved');
create policy cnt_submissions_own_create on public.cnt_submissions for insert to authenticated
  with check (author = (select auth.uid()) and status='pending'
    and (kind <> 'offer' or valid_until between (now() at time zone 'Europe/Warsaw')::date
                                                   and (now() at time zone 'Europe/Warsaw')::date + 180));
create policy cnt_submissions_own_delete on public.cnt_submissions for delete to authenticated using (author = (select auth.uid()));

-- No public table access. The public feed exposes approved content only, without account identifiers.
create function public.cnt_community(locale text, entry_kind text)
returns table(id uuid, title text, ingredients text, details text, store text, region text,
  price_cents integer, valid_until date, source text)
language sql stable security definer set search_path = ''
as $$
  select s.id,s.title,s.ingredients,s.details,s.store,s.region,s.price_cents,s.valid_until,s.source
  from public.cnt_submissions s
  where s.status='approved' and s.lang=locale and s.kind=entry_kind
    and (s.valid_until is null or s.valid_until >= (now() at time zone 'Europe/Warsaw')::date)
  order by s.created_at desc limit 40;
$$;
revoke all on function public.cnt_community(text,text) from public;
grant execute on function public.cnt_community(text,text) to anon, authenticated;

create function public.cnt_my_submissions()
returns table(id uuid, kind text, title text, status text)
language sql stable security definer set search_path = ''
as $$
  select s.id,s.kind,s.title,s.status from public.cnt_submissions s
  where s.author=(select auth.uid()) order by s.created_at desc limit 40;
$$;
revoke all on function public.cnt_my_submissions() from public, anon;
grant execute on function public.cnt_my_submissions() to authenticated;

create function public.cnt_delete_account()
returns void language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if coalesce((auth.jwt()->>'iat')::bigint,0) < extract(epoch from (now() - interval '12 minutes')) then
    raise exception 'Recent sign-in required' using errcode='28000';
  end if;
  delete from auth.users where id=caller;
end;
$$;
revoke all on function public.cnt_delete_account() from public, anon;
grant execute on function public.cnt_delete_account() to authenticated;

create function public.cnt_limit_owned_rows()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  author_id uuid;
begin
  if tg_table_name='cnt_shares' then
    author_id := new.owner;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(author_id::text,1));
    delete from public.cnt_shares where owner=author_id and expires_at <= now();
    if (select count(*) from public.cnt_shares where owner=author_id) >= 30 then
      raise exception 'Share limit reached';
    end if;
  else
    author_id := new.author;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(author_id::text,2));
    if (select count(*) from public.cnt_submissions where author=author_id and (created_at > now()-interval '1 day' or status='pending')) >= 12 then
      raise exception 'Submission limit reached';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.cnt_limit_owned_rows() from public, anon, authenticated;
create trigger cnt_share_limit before insert on public.cnt_shares for each row execute function public.cnt_limit_owned_rows();
create trigger cnt_submission_limit before insert on public.cnt_submissions for each row execute function public.cnt_limit_owned_rows();

-- Clear expired snapshots even if the owner never returns. pg_cron is enabled
-- independently in the production project, then this statement is scheduled once.
-- delete from public.cnt_shares where expires_at <= now();

commit;
