import settings from './site-settings.js';
import { language, t } from './i18n.js';
import { safeOfferUrl } from './domain.js';

const idPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const sdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.3/+esm';
const translations = {
  pl:['Konto','Zaloguj się','Adres e-mail','Wyślij kod','Kod z wiadomości','Potwierdź kod','Wyloguj się',
    'Kod jednorazowy został wysłany.','Operacja nie powiodła się. Spróbuj ponownie.','Udostępnij ulubione','Udostępnij listę zakupów',
    'Link dostępny przez 7 dni dla zalogowanych odbiorców.','Brak elementów do udostępnienia.','Dodaj zawartość linku',
    'Ten link wygasł lub został cofnięty.','Dodaj przepis','Dodaj lokalną promocję','Nazwa','Sposób przygotowania','Wyślij do moderacji',
    'Otrzymaliśmy zgłoszenie do sprawdzenia.','Utworzone linki','Cofnij dostęp','Moje zgłoszenia','Usuń','Oczekuje na sprawdzenie','Opublikowane','Odrzucone',
    'Usuń konto','Usunięcie konta usuwa Twoje zgłoszenia i linki. Potwierdź po ponownym zalogowaniu.','Treści społeczności',
    'Zaloguj się, aby otworzyć udostępniony link.','Zalogowano','Zgadzam się z regulaminem i zapoznałem się z polityką prywatności.','Nie udało się załadować konta.',
    'Skopiuj link','Link skopiowany','Zawartość dodana','Warunki promocji'],
  en:['Account','Sign in','Email address','Send code','Code from email','Confirm code','Sign out',
    'A one-time code has been sent.','The operation failed. Try again.','Share favorites','Share shopping list',
    'The link is valid for 7 days for signed-in recipients.','There are no items to share.','Import shared items',
    'This link has expired or was revoked.','Submit a recipe','Submit a local deal','Name','Cooking instructions','Send for review',
    'Your submission is awaiting review.','Shared links','Revoke access','My submissions','Delete','Pending review','Published','Rejected',
    'Delete account','Deleting your account also removes your submissions and links. Sign in again if required.','Community posts',
    'Sign in to open this shared link.','Signed in','I agree to the terms and have read the privacy policy.','Could not load the account.',
    'Copy link','Link copied','Shared items added','Offer terms'],
};
const keys = ['account','signIn','email','sendCode','code','confirmCode','signOut','sent','error','favorites',
  'shopping','shareNote','empty','import','missing','recipe','offer','name','steps','submit','pending','links','revoke',
  'posts','delete','pendingStatus','approvedStatus','rejectedStatus','deleteAccount','deletePrompt','feed','sharedSignIn',
  'signedIn','accept','unavailable','copy','copied','imported','dealTerms'];
const m = key => (translations[language]??translations.en)[keys.indexOf(key)];
const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick = ({data,error}) => { if(error)throw error; return data; };
const host = () => location.origin + location.pathname;
const shareHash = () => /^#share\/([\da-f-]+)$/i.exec(location.hash)?.[1] ?? '';
const isConfigured = () => !!(settings.supabaseUrl && settings.supabaseKey);
let db, connection, session, emailAddress, shareToken='', currentPost='', callbacks, dialog;
let feedCache = new Map();

export function communityReady() { return isConfigured() && ['pl','en'].includes(language); }
async function connect() {
  if (!isConfigured()) throw Error('Account configuration is missing');
  if (!connection) connection = import(sdkUrl).then(async ({createClient}) => {
    db = createClient(settings.supabaseUrl,settings.supabaseKey,{auth:{flowType:'pkce'}});
    session = pick(await db.auth.getSession()).session;
    db.auth.onAuthStateChange((_event,newSession) => { session=newSession; });
  }).catch(error => { connection=null; throw error; });
  await connection;
}
function status(text) { const el=dialog.querySelector('[role="status"]'); if(el)el.textContent=text; }
function linkFor(id) { return host()+'#share/'+id; }
function formRow(label, field) { return `<label>${label}${field}</label>`; }
function button(action,label,extra='') { return `<button type="button" class="secondary" data-account-action="${action}" ${extra}>${escape(label)}</button>`; }
function show(body) {
  dialog.innerHTML=`<div class="dialog-head"><h2 id="account-title">${m('account')}</h2><button type="button" class="close" data-account-action="close" aria-label="${escape(t('close'))}">×</button></div>${body}<p role="status"></p>`;
  if(!dialog.open)dialog.showModal();
}
function terms() {
  return `<p><a href="./regulamin.html" target="_blank" rel="noopener">${language==='pl'?'Regulamin':'Terms'}</a> · <a href="./polityka-prywatnosci.html" target="_blank" rel="noopener">${t('privacyPolicyLink')}</a></p>`;
}
function signIn() {
  const accept = formRow(m('accept'),'<input name="accept" type="checkbox" required>');
  show(`<p>${shareToken?m('sharedSignIn'):m('signIn')}</p>${terms()}<form data-account-form="email" class="account-form">
    ${formRow(m('email'),'<input type="email" name="email" autocomplete="email" required maxlength="254">')}
    ${accept}<button class="primary">${m('sendCode')}</button></form>
    <form data-account-form="social" class="account-form">${accept}<div class="inline">
    <button class="secondary" value="google">Google</button><button class="secondary" value="facebook">Facebook</button></div></form>`);
}
function verifyCode() {
  show(`<p>${m('sent')}</p><form data-account-form="otp" class="account-form">
    ${formRow(m('code'),'<input name="token" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" required>')}
    <button class="primary">${m('confirmCode')}</button></form>`);
}
async function dashboard() {
  show(`<p>${m('signedIn')}</p><div class="account-actions">
    ${button('favorites',m('favorites'))}${button('shopping',m('shopping'))}${button('recipe',m('recipe'))}${button('offer',m('offer'))}</div>
    <section id="account-lists"></section><div class="account-actions">${button('signout',m('signOut'))}${button('delete',m('deleteAccount'))}</div>`);
  const panel=dialog.querySelector('#account-lists');
  const [shares,posts] = await Promise.all([
    db.from('cnt_shares').select('id,kind').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(30),
    db.rpc('cnt_my_submissions'),
  ]);
  if(!panel.isConnected)return;
  panel.innerHTML=`<h3>${m('links')}</h3><ul>${(pick(shares)??[]).map(row=>`<li>${escape(t(row.kind))} ${button('showlink',m('copy'),`data-record="${escape(row.id)}"`)} ${button('revoke',m('revoke'),`data-record="${escape(row.id)}"`)}</li>`).join('')}</ul>
  <h3>${m('posts')}</h3><ul>${(pick(posts)??[]).map(row=>`<li>${escape(row.title)} · ${escape(m(row.status+'Status'))} ${button('removePost',m('delete'),`data-record="${escape(row.id)}"`)}</li>`).join('')}</ul>`;
}
function showLink(id) {
  const link=linkFor(id);
  show(`<p>${m('shareNote')}</p><label><span class="sr-only">${m('copy')}</span><input id="share-url" value="${escape(link)}" readonly></label>
    <div class="account-actions">${button('copy',m('copy'))}${button('back',m('account'))}</div>`);
}
async function shared() {
  if (!idPattern.test(shareToken)) return;
  if (!session?.user) { signIn(); return; }
  const id=shareToken;
  const [data] = pick(await db.rpc('cnt_read_share',{link:id}));
  if(!data) { show(`<p>${m('missing')}</p>`); return; }
  show(`<p>${escape(t(data.kind))} · ${data.items.length}</p>${button('import',m('import'))}`);
  const trigger=dialog.querySelector('[data-account-action="import"]');
  trigger.addEventListener('click',() => {
    try { callbacks.import(data.kind,data.items); } catch { status(m('error')); return; }
    shareToken='';
    history.replaceState(history.state,'',location.pathname+(data.kind==='shopping'?'#shopping':'#favorites'));
    window.dispatchEvent(new Event('hashchange'));
    trigger.disabled=true;
    status(m('imported'));
  },{once:true});
}
function postForm(kind) {
  currentPost=kind;
  const recipe=kind==='recipe';
  show(`<h3>${recipe?m('recipe'):m('offer')}</h3><form class="account-form" data-account-form="post">
    ${formRow(m('name'),'<input name="title" minlength="3" maxlength="150" required>')}
    ${recipe?formRow(t('ingredients'),'<textarea name="ingredients" minlength="4" maxlength="3000" required></textarea>'):
      formRow(t('store'),'<input name="store" minlength="2" maxlength="80" required>')+
      formRow(language==='pl'?'Miejscowość lub region':'Town or region','<input name="region" minlength="2" maxlength="100" required>')+
      formRow(t('price')+' PLN','<input type="number" name="price" min=".01" max="100000" step=".01" required>')+
      formRow(t('until'),'<input type="date" name="until" required>')}
    ${formRow(recipe?m('steps'):m('dealTerms'),'<textarea name="details" minlength="8" maxlength="4500" required></textarea>')}
    ${formRow(t('source'),`<input type="url" name="source" placeholder="https://" maxlength="500" ${recipe?'':'required'}>`)}
    <button class="primary">${m('submit')}</button></form>`);
}
async function submit(event) {
  const form=event.target;
  const type=form.dataset.accountForm;
  if(!type)return;
  event.preventDefault();
  const fields=new FormData(form);
  const values=key=>String(fields.get(key)??'').trim();
  const controls=[...form.querySelectorAll('button')];
  controls.forEach(control=>control.disabled=true);
  try {
    if(type==='email') {
      emailAddress=values('email');
      pick(await db.auth.signInWithOtp({email:emailAddress}));
      verifyCode();
    } else if(type==='otp') {
      const result=pick(await db.auth.verifyOtp({email:emailAddress,token:values('token'),type:'email'}));
      session=result.session;emailAddress='';
      await (shareToken?shared():dashboard());
    } else if(type==='social') {
      const provider=event.submitter?.value;
      if(!['facebook','google'].includes(provider))throw Error('Provider');
      if(shareToken)sessionStorage.setItem('cnt-share-return',shareToken);
      pick(await db.auth.signInWithOAuth({provider,options:{redirectTo:host()}}));
    } else if(type==='post') {
      if(!session?.user)throw Error('Sign-in needed');
      const source=values('source') ? safeOfferUrl(values('source')) : null;
      if(values('source')&&!source)throw Error('Source URL');
      const entry={kind:currentPost,lang:language,title:values('title'),details:values('details'),source};
      if(currentPost==='recipe')entry.ingredients=values('ingredients');
      else Object.assign(entry,{store:values('store'),region:values('region'),price_cents:Math.round(Number(values('price'))*100),valid_until:values('until')});
      pick(await db.from('cnt_submissions').insert(entry));
      await dashboard();
      status(m('pending'));
    }
  } catch { status(m('error')); }
  finally { controls.forEach(control=>control.disabled=false); }
}
async function click(event) {
  const control=event.target.closest('[data-account-action]');
  if(!control)return;
  const action=control.dataset.accountAction;
  if(action==='close'){dialog.close();return;}
  if(action==='import')return;
  control.disabled=true;
  try {
    if(action==='recipe'||action==='offer')postForm(action);
    if(action==='favorites'||action==='shopping'){
      const items=callbacks.snapshot(action);
      if(!items.length){status(m('empty'));return;}
      const data=pick(await db.from('cnt_shares').insert({kind:action,items}).select('id').single());
      showLink(data.id);
    }
    if(action==='back')await dashboard();
    if(action==='showlink')showLink(control.dataset.record);
    if(action==='copy'){
      const input=dialog.querySelector('#share-url');
      try{await navigator.clipboard.writeText(input.value);status(m('copied'));}
      catch{input.select();}
    }
    if(['revoke','removePost'].includes(action)&&idPattern.test(control.dataset.record||'')){
      const table=action==='revoke'?'cnt_shares':'cnt_submissions';
      pick(await db.from(table).delete().eq('id',control.dataset.record));
      feedCache.clear();
      await dashboard();
    }
    if(action==='signout'){pick(await db.auth.signOut()); session=null; signIn();}
    if(action==='delete'&&confirm(m('deletePrompt'))){
      pick(await db.rpc('cnt_delete_account'));
      await db.auth.signOut({scope:'local'});
      session=null;
      signIn();
    }
  }catch{status(m('error'));}
  finally{control.disabled=false;}
}
export function initCommunity(options) {
  if(!isConfigured())return;
  callbacks=options;
  dialog=document.querySelector('#account-dialog');
  dialog.addEventListener('click',click);
  dialog.addEventListener('submit',submit);
  document.querySelector('#account-button').addEventListener('click',async () => {
    try{
      await connect();
      shareToken=shareHash();
      await (shareToken?shared():session?.user?dashboard():signIn());
    }catch{show(`<p>${m('unavailable')}</p>`);}
  });
  void openSharedLink();
  window.addEventListener('hashchange',openSharedLink);
}
async function openSharedLink() {
  if(!communityReady())return;
  shareToken=shareHash();
  try {
    if(!shareToken && new URL(location.href).searchParams.has('code')){
      shareToken=sessionStorage.getItem('cnt-share-return')??'';
      sessionStorage.removeItem('cnt-share-return');
    }
    if(!idPattern.test(shareToken))return;
    await connect(); await shared();
  }catch{show(`<p>${m('unavailable')}</p>`);}
}
export function configureAccountButton() {
  const button=document.querySelector('#account-button');
  if(button){button.hidden=!communityReady();button.textContent=m('account');}
}
export function communitySection(kind) {
  return communityReady()?`<section class="panel" id="community-section" data-kind="${kind}" hidden></section>`:'';
}
export async function refreshCommunity() {
  const node=document.querySelector('#community-section'), lang=language;
  if(!node||!communityReady())return;
  const kind=node.dataset.kind, key=lang+'-'+kind;
  try {
    await connect();
    if(!feedCache.has(key))feedCache.set(key,db.rpc('cnt_community',{locale:lang,entry_kind:kind}).then(pick).catch(error=>{feedCache.delete(key);throw error;}));
    const rows=await feedCache.get(key);
    if(!node.isConnected||!rows.length)return;
    node.hidden=false;
    node.innerHTML=`<h2>${m('feed')}</h2>${rows.map(row => `<details><summary>${escape(row.title)}${kind==='offer'?` · ${escape(new Intl.NumberFormat(lang,{style:'currency',currency:'PLN'}).format(row.price_cents/100))}`:''}</summary>
    ${kind==='offer'?`<p>${escape(row.store)} · ${escape(row.region)} · ${escape(row.valid_until)}</p>`:`<p class="preserve-lines">${escape(row.ingredients)}</p>`}
    <p class="preserve-lines">${escape(row.details)}</p>${safeOfferUrl(row.source)?`<a href="${escape(safeOfferUrl(row.source))}" rel="noopener noreferrer" target="_blank">${t('source')}</a>`:''}</details>`).join('')}`;
  }catch{/* Community is an independent online section. */}
}
