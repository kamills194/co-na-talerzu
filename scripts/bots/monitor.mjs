// Bot „pilnujący”: sprawdza działanie https://conatalerz.pl i prowadzi jedno zgłoszenie o awarii.
// Użycie: node scripts/bots/monitor.mjs [--expect-sw apps/web/dist/sw.js]
// Awaria → otwiera zgłoszenie (lub dopisuje komentarz, gdy zmienił się zestaw problemów). Powrót do normy → zamyka je.
import { readFile } from 'node:fs/promises';
import tls from 'node:tls';
import { execFileSync } from 'node:child_process';
import { ensureLabel, issuesWithLabel, findByMarker, marker, createIssue, comment, updateIssue, runUrl, safe, dryRun } from './github.mjs';

const BASE = process.env.SITE_URL || 'https://conatalerz.pl', HOST = new URL(BASE).hostname;
const LABEL = 'bot: monitor', ID = 'monitor-' + HOST;
const UA = { 'User-Agent': 'conatalerz-monitor/1.0 (+https://github.com/kamills194/co-na-talerzu)' };
const results = [];
const check = async (name, fn) => { try { const d = await fn(); results.push({ name, ok: true, detail: d || 'OK' }); } catch (e) { results.push({ name, ok: false, detail: e.message }); } };
async function get(path, opts = {}) {
  const t0 = Date.now();
  const r = await fetch(new URL(path, BASE), { headers: UA, redirect: opts.redirect || 'follow', signal: AbortSignal.timeout(20000), cache: 'no-store', method: opts.method || 'GET' });
  r.ms = Date.now() - t0; return r;
}
const expect = (cond, msg) => { if (!cond) throw Error(msg); };
const TYPES = { js: /javascript/, css: /text\/css/, webmanifest: /manifest\+json|application\/json/, svg: /image\/svg\+xml/, png: /image\/png/, html: /text\/html/, json: /json/ };

let remoteSw = '';
await check('Strona główna', async () => {
  const r = await get('/'); expect(r.status === 200, `HTTP ${r.status}`);
  const html = await r.text(); expect(html.includes('<title>Co na talerz'), 'brak tytułu aplikacji w HTML — czy to na pewno nasza strona?');
  expect(html.includes('app.js'), 'HTML nie ładuje app.js');
  return `HTTP 200, ${r.ms} ms`;
});
await check('Czas odpowiedzi', async () => { const r = await get('/'); await r.arrayBuffer(); expect(r.ms < 5000, `wolno: ${r.ms} ms`); return `${r.ms} ms`; });
await check('Przekierowanie http → https', async () => {
  const r = await fetch(`http://${HOST}/`, { headers: UA, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  expect([301, 302, 307, 308].includes(r.status), `HTTP ${r.status} zamiast przekierowania`);
  expect((r.headers.get('location') || '').startsWith('https://'), `cel: ${r.headers.get('location')}`);
});
await check('Przekierowanie www → bez www', async () => {
  const r = await fetch(`https://www.${HOST}/`, { headers: UA, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  expect([301, 302, 307, 308].includes(r.status), `HTTP ${r.status}`);
  expect((r.headers.get('location') || '').startsWith(`https://${HOST}/`), `cel: ${r.headers.get('location')}`);
});
await check('Service worker i pliki offline', async () => {
  const r = await get('/sw.js'); expect(r.status === 200, `sw.js: HTTP ${r.status}`); remoteSw = await r.text();
  const m = /const ASSETS = (\[[^\]]*\])/.exec(remoteSw); expect(m, 'sw.js bez listy ASSETS');
  const assets = JSON.parse(m[1].replace(/'/g, '"')), bad = [];
  await Promise.all(assets.map(async a => {
    const x = await get(a); const ext = (a.match(/\.(\w+)$/) || [, 'html'])[1];
    if (x.status !== 200) bad.push(`${a}: HTTP ${x.status}`);
    else if (TYPES[ext] && !TYPES[ext].test(x.headers.get('content-type') || '')) bad.push(`${a}: typ ${x.headers.get('content-type')}`);
    await x.arrayBuffer().catch(() => {});
  }));
  expect(!bad.length, bad.join('; '));
  return `${assets.length} plików OK`;
});
await check('Manifest aplikacji', async () => {
  const m = await (await get('/manifest.webmanifest')).json();
  expect(m.name && m.start_url && m.icons?.some(i => i.sizes === '512x512'), 'niepełny manifest (name, start_url, ikona 512)');
});
await check('Oferty (offers.json)', async () => { const r = await get('/offers.json'); expect(r.status === 200, `HTTP ${r.status}`); const d = await r.json(); expect(d.version === 1 && Array.isArray(d.offers), 'zły format'); return `${d.offers.length} ofert, odczyt ${d.updatedAt || '?'}`; });
await check('Odbiór zgłoszeń błędów (report.php)', async () => { const r = await get('/report.php'); expect(r.status === 405, `HTTP ${r.status} (oczekiwano 405 dla GET)`); });
await check('Zgłoszenia niedostępne z WWW', async () => { const r = await get('/_reports/'); expect([403, 404].includes(r.status), `HTTP ${r.status} — katalog _reports jest publiczny!`); });
await check('Certyfikat SSL', () => new Promise((ok, fail) => {
  const s = tls.connect({ host: HOST, port: 443, servername: HOST, timeout: 15000 }, () => {
    const c = s.getPeerCertificate(); s.end();
    const days = Math.floor((new Date(c.valid_to) - Date.now()) / 864e5);
    days < 14 ? fail(Error(`wygasa za ${days} dni (${c.valid_to})`)) : ok(`ważny jeszcze ${days} dni`);
  });
  s.on('error', fail); s.on('timeout', () => { s.destroy(); fail(Error('przekroczony czas połączenia')); });
}));
const swArg = process.argv.indexOf('--expect-sw');
if (swArg > 0) await check('Wdrożona wersja = main', async () => {
  const local = /const CACHE = '([^']*)'/.exec(await readFile(process.argv[swArg + 1], 'utf8'))?.[1];
  const remote = /const CACHE = '([^']*)'/.exec(remoteSw)?.[1];
  if (local === remote) return local;
  // Świeży commit może jeszcze się wdrażać — alarm dopiero po 30 minutach.
  let age = Infinity; try { age = (Date.now() / 1000 - Number(execFileSync('git', ['log', '-1', '--format=%ct'], { encoding: 'utf8' }))) / 60; } catch {}
  if (age < 30) return `wdrażanie w toku (${remote} → ${local})`;
  throw Error(`na serwerze ${remote || 'brak'}, w main ${local} — wdrożenie nie doszło do skutku`);
});

const failed = results.filter(r => !r.ok);
const table = results.map(r => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${safe(r.detail).replace(/\|/g, '\\|')} |`).join('\n');
console.log(results.map(r => `${r.ok ? 'OK ' : 'ERR'} ${r.name}: ${r.detail}`).join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) await import('node:fs/promises').then(fs => fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `## Monitor ${BASE}\n\n| | Sprawdzenie | Wynik |\n|---|---|---|\n${table}\n`));

await ensureLabel(LABEL, 'b60205', 'Awaria strony wykryta przez bota monitorującego');
const open = findByMarker(await issuesWithLabel(LABEL, 'open'), ID);
const signature = failed.map(f => f.name).sort().join(', ');
if (failed.length) {
  const text = `${marker(ID)}\n<!-- sig:${signature} -->\nBot monitorujący wykrył problem z **${BASE}** (${new Date().toISOString()}).\n\n| | Sprawdzenie | Wynik |\n|---|---|---|\n${table}\n\nZgłoszenie zamknie się samo, gdy wszystkie sprawdzenia przejdą. Przebieg: ${runUrl()}`;
  if (!open) await createIssue(`🔴 Awaria ${HOST}: ${signature}`, text, [LABEL]);
  else if (!(open.body || '').includes(`<!-- sig:${signature} -->`)) { await updateIssue(open.number, { title: `🔴 Awaria ${HOST}: ${signature}`, body: text }); await comment(open.number, `Zmienił się zakres problemu: ${signature}. Przebieg: ${runUrl()}`); }
  process.exitCode = 1;
} else if (open) {
  await comment(open.number, `✅ Wszystkie sprawdzenia przechodzą — strona działa. Przebieg: ${runUrl()}`);
  await updateIssue(open.number, { state: 'closed', state_reason: 'completed' });
}
if (dryRun) console.log('(tryb na sucho — bez zmian w zgłoszeniach)');
