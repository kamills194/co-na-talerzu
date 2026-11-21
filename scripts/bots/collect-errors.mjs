// Bot „zgłaszający”: zamienia zgłoszenia błędów ze strony (pliki errors-*.jsonl pobrane z nazwa.pl) w Issues.
// Użycie: node scripts/bots/collect-errors.mjs <katalog z plikami .jsonl>
// Ten sam błąd (rodzaj + komunikat + plik + wiersz) to jedno zgłoszenie: kolejne wystąpienia dopisuje jako komentarz,
// a zamknięte zgłoszenie otwiera ponownie, gdy błąd wróci po poprawce.
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ensureLabel, issuesWithLabel, findByMarker, marker, createIssue, comment, updateIssue, runUrl, safe, dryRun } from './github.mjs';

const LABEL = 'bot: błąd strony';
// Szum spoza aplikacji: rozszerzenia przeglądarek, błędy z innych domen bez szczegółów, przerwane połączenia.
const NOISE = [/^Script error\.?$/i, /extension:\/\//i, /ResizeObserver loop/i, /^Load failed$/i, /NetworkError when attempting to fetch/i, /Failed to fetch/i];

export function fingerprint(e) {
  const msg = String(e.message || '').replace(/\d+/g, 'N').replace(/(['"]).*?\1/g, '"…"').slice(0, 200);
  return createHash('sha256').update([e.kind, msg, e.source, e.line].join('|')).digest('hex').slice(0, 12);
}
export function isNoise(e) { return NOISE.some(r => r.test(e.message || '') || r.test(e.source || '') || r.test(e.stack || '')); }
export function browser(ua = '') {
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'inny';
  const br = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'inna';
  return `${br} / ${os}`;
}
export function group(records) {
  const groups = new Map();
  for (const e of records) {
    if (!e || typeof e !== 'object' || isNoise(e)) continue;
    const id = fingerprint(e);
    const g = groups.get(id) || { id, sample: e, count: 0, first: e.received, last: e.received, browsers: new Map(), installed: 0 };
    g.count++; if (e.received < g.first) g.first = e.received; if (e.received > g.last) g.last = e.received;
    const b = browser(e.ua); g.browsers.set(b, (g.browsers.get(b) || 0) + 1); if (e.standalone) g.installed++;
    groups.set(id, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}
function redact(value) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[e-mail]')
    .replace(/(?:eyJ[A-Za-z0-9_-]+)(?:\.[A-Za-z0-9_-]+){1,2}/g,'[token]')
    .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi,'[id]')
    .replace(/([?&#](?:code|token|access_token|refresh_token|email)=)[^\s&#)'"]+/gi,'$1[redacted]');
}
const browsers = g => [...g.browsers].sort((a, b) => b[1] - a[1]).map(([b, n]) => `${safe(b)} (${n})`).join(', ');
function body(g) {
  const e = g.sample;
  return `${marker('error-' + g.id)}
Bot wykrył błąd na **https://conatalerz.pl** zgłoszony automatycznie z przeglądarki użytkownika.

| | |
|---|---|
| Rodzaj | \`${safe(e.kind)}\` |
| Komunikat | ${safe(redact(e.message)).replace(/\|/g, '\\|').replace(/\n/g, ' ')} |
| Plik | \`${safe(redact(e.source)) || '—'}\`${e.line ? ` wiersz ${e.line}:${e.col}` : ''} |
| Wystąpienia | ${g.count} (${safe(g.first)} – ${safe(g.last)}) |
| Przeglądarki | ${browsers(g)} |
| Z zainstalowanej aplikacji | ${g.installed} |
| Język strony | ${safe(e.lang) || '—'} |

${e.stack ? '```\n' + safe(redact(e.stack)) + '\n```' : ''}

Zamknij zgłoszenie po wdrożeniu poprawki — jeśli błąd wróci, bot otworzy je ponownie.
Przebieg bota: ${runUrl()}`;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) { console.error('Podaj katalog z plikami errors-*.jsonl'); process.exit(2); }
  const records = [];
  for (const f of (await readdir(dir)).filter(f => f.endsWith('.jsonl'))) {
    for (const line of (await readFile(join(dir, f), 'utf8')).split('\n')) { if (!line.trim()) continue; try { records.push(JSON.parse(line)); } catch { /* uszkodzona linia */ } }
  }
  const groups = group(records);
  console.log(`Zgłoszeń: ${records.length}, różnych błędów (bez szumu): ${groups.length}${dryRun ? ' — tryb na sucho' : ''}`);
  if (!groups.length) return;
  await ensureLabel(LABEL, 'd73a4a', 'Błąd zgłoszony automatycznie ze strony conatalerz.pl');
  const issues = await issuesWithLabel(LABEL);
  for (const g of groups.slice(0, 20)) {
    const found = findByMarker(issues, 'error-' + g.id);
    const note = `Ponownie: **${g.count}×** (${safe(g.first)} – ${safe(g.last)}). Przeglądarki: ${browsers(g)}. Przebieg: ${runUrl()}`;
    if (!found) { await createIssue(`Błąd na stronie: ${redact(g.sample.message || g.sample.kind).replace(/\s+/g, ' ').slice(0, 90)}`, body(g), [LABEL]); console.log('Nowe zgłoszenie', g.id); }
    else if (found.state === 'closed') { await updateIssue(found.number, { state: 'open' }); await comment(found.number, '🔁 Błąd wrócił po zamknięciu zgłoszenia. ' + note); console.log('Otwarte ponownie #' + found.number); }
    else { await comment(found.number, note); console.log('Dopisano do #' + found.number); }
  }
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
