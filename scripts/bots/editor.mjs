// Bot „redaktor”: codzienny przegląd treści (przepisy, tłumaczenia interfejsu, oferty).
// Użycie: node scripts/bots/editor.mjs [--fix] [--issue]
//   --fix    bezpieczne poprawki redakcyjne zapisuje w plikach (podwójne spacje, spacja przed przecinkiem, „...” → „…”, spacje na brzegach)
//   --issue  aktualizuje jedno zgłoszenie „Redakcja treści” z listą rzeczy do ręcznego przejrzenia (zamyka je, gdy lista jest pusta)
// Poprawia wyłącznie teksty, nigdy ilości, czasy, alergeny ani identyfikatory. Każda poprawka trafia do PR, nie prosto do main.
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { ensureLabel, issuesWithLabel, findByMarker, marker, createIssue, updateIssue, comment, runUrl, safe } from './github.mjs';

const SRC = new URL('../../apps/web/src/', import.meta.url);
const fix = process.argv.includes('--fix'), issue = process.argv.includes('--issue');
const i18n = await import(new URL('i18n.js', SRC));
const pl = await import(new URL('recipes.pl.js', SRC));
const codes = i18n.languageCodes.filter(c => c !== 'pl');
const PLURAL = i18n.PLURAL_SUFFIX;

import { tidy, lint } from './text-rules.mjs';

// ---------- Zbieranie tekstów ----------
const texts = []; // {file, lang, where, value}
const add = (file, lang, where, value) => { if (typeof value === 'string') texts.push({ file, lang, where, value }); };
for (const [k, v] of Object.entries(i18n.messages)) add('i18n.js', 'pl', `interfejs: ${k}`, v);
for (const r of pl.recipes) { add('recipes.pl.js', 'pl', `${r.id}: nazwa`, r.name); r.steps.forEach((s, i) => add('recipes.pl.js', 'pl', `${r.id}: krok ${i + 1}`, s)); add('recipes.pl.js', 'pl', `${r.id}: opis zdjęcia`, r.photoAlt); }
const coverage = [];
for (const code of codes) {
  const ui = (await import(new URL(`i18n.${code}.js`, SRC))).messages, rc = await import(new URL(`recipes.${code}.js`, SRC));
  for (const [k, v] of Object.entries(ui)) add(`i18n.${code}.js`, code, `interfejs: ${k}`, v);
  for (const [id, r] of Object.entries(rc.recipes)) { add(`recipes.${code}.js`, code, `${id}: nazwa`, r.name); (r.steps || []).forEach((s, i) => add(`recipes.${code}.js`, code, `${id}: krok ${i + 1}`, s)); add(`recipes.${code}.js`, code, `${id}: opis zdjęcia`, r.photoAlt); }
  for (const [id, v] of Object.entries(rc.products)) add(`recipes.${code}.js`, code, `produkt ${id}`, v);
  const missingUi = Object.keys(i18n.messages).filter(k => !PLURAL.test(k) && !Object.hasOwn(ui, k));
  const missingRecipes = pl.recipes.filter(r => { const t = rc.recipes[r.id]; return !t || !t.name || !t.photoAlt || t.steps?.length !== r.steps.length; }).map(r => r.id);
  const missingProducts = Object.keys(pl.products).filter(id => !rc.products[id]);
  const untranslated = pl.recipes.filter(r => rc.recipes[r.id]?.name === r.name && !/^[A-Z][a-z]+ [A-Z]/.test(r.name)).map(r => r.id);
  coverage.push({ code, missingUi, missingRecipes, missingProducts, untranslated });
}

// ---------- Poprawki ----------
const literal = (v, q) => q + v.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q).replace(/\n/g, '\\n') + q;
const changes = [], manual = [], files = new Map();
for (const t of texts) {
  const fixed = tidy(t.value, t.lang);
  if (fixed !== t.value) {
    if (!files.has(t.file)) files.set(t.file, await readFile(new URL(t.file, SRC), 'utf8'));
    let src = files.get(t.file), done = false;
    for (const q of ["'", '"', '`']) {
      const from = literal(t.value, q); if (q === '`' && /\$\{/.test(t.value)) continue;
      const n = src.split(from).length - 1;
      if (n >= 1 && (n === 1 || texts.filter(x => x.file === t.file && x.value === t.value).length === n)) { src = src.split(from).join(literal(fixed, q)); done = true; break; }
    }
    if (done) { files.set(t.file, src); changes.push({ ...t, fixed }); } else manual.push({ ...t, problem: `do poprawy: „${fixed}”` });
  }
  for (const p of lint(t.value, t.lang)) manual.push({ ...t, problem: p });
}
// Kroki przepisu powinny kończyć się kropką (lub innym znakiem końca zdania).
for (const t of texts) if (/: krok \d+$/.test(t.where) && !/[.!?…)»”]$/.test(t.value.trim())) manual.push({ ...t, problem: 'krok bez kropki na końcu' });

// ---------- Oferty ----------
const offersNote = [];
try {
  const o = JSON.parse(await readFile(new URL('offers.json', SRC), 'utf8'));
  const age = (Date.now() - Date.parse(o.updatedAt)) / 36e5;
  if (!o.offers?.length) offersNote.push('Brak aktualnych ofert w offers.json.');
  if (!(age < 30)) offersNote.push(`Oferty odczytano ${Number.isFinite(age) ? Math.round(age) + ' h temu' : 'nie wiadomo kiedy'} — sprawdź bota ofert.`);
  for (const s of o.sources || []) if (s.status !== 'ok') offersNote.push(`Źródło ofert z błędem: ${s.source} — ${s.error}`);
} catch (e) { offersNote.push('Nie można odczytać offers.json: ' + e.message); }

if (fix) for (const [file, src] of files) await writeFile(new URL(file, SRC), src);

// ---------- Raport ----------
const byLang = list => Object.entries(list.reduce((a, x) => ((a[x.lang] ||= []).push(x), a), {}));
const cov = coverage.map(c => `| ${c.code} | ${c.missingUi.length} | ${c.missingRecipes.length} | ${c.missingProducts.length} | ${c.untranslated.length} |`).join('\n');
const covDetails = coverage.filter(c => c.missingUi.length + c.missingRecipes.length + c.missingProducts.length).map(c =>
  `- **${c.code}**: ${[c.missingUi.length && `interfejs: ${c.missingUi.slice(0, 15).join(', ')}${c.missingUi.length > 15 ? '…' : ''}`, c.missingRecipes.length && `przepisy: ${c.missingRecipes.slice(0, 15).join(', ')}${c.missingRecipes.length > 15 ? '…' : ''}`, c.missingProducts.length && `produkty: ${c.missingProducts.slice(0, 15).join(', ')}`].filter(Boolean).join('; ')}`).join('\n');
const report = `## Redakcja treści — ${new Date().toISOString().slice(0, 10)}

**Poprawki automatyczne:** ${changes.length}${changes.length ? (fix ? ' (w pull requeście bota)' : ' (uruchom z --fix)') : ''}
${changes.slice(0, 40).map(c => `- \`${c.file}\` ${safe(c.where)}: „${safe(c.value)}” → „${safe(c.fixed)}”`).join('\n')}

**Do przejrzenia ręcznie:** ${manual.length}
${byLang(manual).map(([lang, l]) => `<details><summary>${lang} (${l.length})</summary>\n\n${l.slice(0, 60).map(m => `- \`${m.file}\` ${safe(m.where)} — ${safe(m.problem)}: „${safe(m.value).slice(0, 160)}”`).join('\n')}\n</details>`).join('\n')}

**Kompletność tłumaczeń** (braki: interfejs / przepisy / produkty / nazwy nieprzetłumaczone)

| Język | Interfejs | Przepisy | Produkty | Nazwy jak po polsku |
|---|---|---|---|---|
${cov}

${covDetails}

**Oferty:** ${offersNote.length ? offersNote.map(safe).join(' ') : 'aktualne.'}
`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);

if (issue) {
  const LABEL = 'bot: redakcja', ID = 'editor-report';
  await ensureLabel(LABEL, '0e8a16', 'Przegląd treści przez bota redaktora');
  const open = findByMarker(await issuesWithLabel(LABEL, 'open'), ID);
  const pending = manual.length + offersNote.length + coverage.reduce((n, c) => n + c.missingUi.length + c.missingRecipes.length + c.missingProducts.length, 0);
  const body = `${marker(ID)}\nCodzienny raport bota redaktora. Treść zgłoszenia jest nadpisywana przy każdym przebiegu; zamyka się samo, gdy nie ma nic do zrobienia.\n\n${report}\nPrzebieg: ${runUrl()}`;
  if (pending && !open) await createIssue('📝 Redakcja treści: rzeczy do przejrzenia', body, [LABEL]);
  else if (pending && open) await updateIssue(open.number, { body });
  else if (!pending && open) { await comment(open.number, '✅ Brak uwag redakcyjnych. ' + runUrl()); await updateIssue(open.number, { state: 'closed', state_reason: 'completed' }); }
}
