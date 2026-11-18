import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { messages } from '../src/i18n.js';
test('Każdy moduł aplikacji ma poprawną składnię',async()=>{for(const file of await readdir(new URL('../src/',import.meta.url))){if(file.endsWith('.js')){const r=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../src/'+file,import.meta.url))],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}}});
test('Powłoka offline ma wszystkie zadeklarowane zasoby',async()=>{const sw=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');const assets=sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1];for(const [,path] of assets.matchAll(/'\.\/([^']*)'/g))await access(new URL('../src/'+(path||'index.html'),import.meta.url));const manifest=JSON.parse(await readFile(new URL('../src/manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.lang,'pl');assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));});
test('Literalne klucze komunikatów interfejsu są w słowniku',async()=>{const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');for(const [,key] of app.matchAll(/\bt\('([^']+)'\)/g))assert.ok(key in messages,key);});
test('Każdy plik powłoki jest w pamięci offline, a build nadaje jej nazwę z treści',async()=>{
  const src=new URL('../src/',import.meta.url);const sw=await readFile(new URL('sw.js',src),'utf8');
  const listed=new Set([...sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]));
  for(const file of await readdir(src))if(!['sw.js','offers.json','ads.txt'].includes(file))assert.ok(listed.has(file),`${file} nie jest w ASSETS`);
  const build=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/build.mjs',import.meta.url))],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
  const built=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');assert.match(built,/const CACHE = 'co-na-talerz-[0-9a-f]{12}';/);
});
