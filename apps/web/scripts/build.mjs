import { mkdir, cp, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const name of await readdir(new URL('../src/',import.meta.url))) {
  if(!name.endsWith('.js'))continue;
  const check=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../src/'+name,import.meta.url))],{stdio:'inherit'});
  if(check.status!==0)process.exit(check.status||1);
}
const dest = new URL('../dist/', import.meta.url);
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(new URL('../src/', import.meta.url), dest, { recursive: true });
// Cache-first service worker: without a new cache name installed users keep the old files.
const swPath = new URL('sw.js', dest), sw = await readFile(swPath, 'utf8');
const hash = createHash('sha256');
for (const name of (await readdir(dest)).filter(n => n !== 'sw.js' && n !== 'offers.json').sort()) hash.update(name).update(await readFile(new URL(name, dest)));
hash.update(sw);
const stamped = sw.replace(/const CACHE = '[^']*';/, `const CACHE = 'co-na-talerz-${hash.digest('hex').slice(0, 12)}';`);
if (stamped === sw) { console.error('Nie znaleziono nazwy pamięci podręcznej w sw.js'); process.exit(1); }
await writeFile(swPath, stamped);
console.log('Gotowe: dist/');
