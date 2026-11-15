import { mkdir, cp, rm } from 'node:fs/promises';
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
console.log('Gotowe: dist/');
