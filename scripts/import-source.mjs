import { readdir, readFile, mkdir, writeFile, lstat, copyFile } from 'node:fs/promises';
import { resolve, relative, sep, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

// Usage: node scripts/import-source.mjs app|skills ABSOLUTE_SOURCE
// Existing destination files are never replaced, including on repeated imports.
const [kind, input] = process.argv.slice(2);
if (!['app', 'skills'].includes(kind) || !input) throw Error('Usage: import-source.mjs app|skills ABSOLUTE_SOURCE');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(input);
if (source === root || source.startsWith(root + sep)) throw Error('Source must be outside the destination workspace');
const run = new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID().slice(0,8);
const report = { run, kind, source, files: [], skipped: [] };
const hash = data => createHash('sha256').update(data).digest('hex');
const blocked = new Set(['.git', 'node_modules', 'dist', '.expo', '.next', '.venv', '__pycache__']);
const secret = name => /^\.env(?:\.|$)/i.test(name) && name !== '.env.example' || /\.(pem|key|p12|keystore|mobileprovision)$/i.test(name);
async function walk(dir) {
  const found = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isSymbolicLink() || blocked.has(e.name) || secret(e.name)) { report.skipped.push(relative(source,p)); continue; }
    if (e.isDirectory()) found.push(...await walk(p));
    else if (e.isFile()) found.push(p);
  }
  return found;
}
const files = await walk(source);
const skillDirs = files.filter(p => basename(p) === 'SKILL.md').map(dirname);
if (kind === 'skills' && !skillDirs.length) throw Error('No SKILL.md found; no skills imported');
for (const p of files) {
  const skillDir = kind === 'skills' ? skillDirs.find(d => p.startsWith(d + sep)) : null;
  if (kind === 'skills' && !skillDir) continue;
  const rel = kind === 'app' ? relative(source,p) : basename(skillDir) + sep + relative(skillDir,p);
  const dest = resolve(root, kind === 'app' ? 'apps/web' : '.agents/skills', rel);
  const data = await readFile(p);
  const digest = hash(data);
  // Detect files changing while being read. Importer is a snapshot, never live sync.
  if (hash(await readFile(p)) !== digest) throw Error('Source changed during read: ' + p);
  let existing;
  try { existing = await lstat(dest); } catch(e) { if(e.code !== 'ENOENT') throw e; }
  let status = 'copied';
  if (existing) {
    if (!existing.isFile() || existing.isSymbolicLink()) throw Error('Unsafe destination: '+dest);
    if (hash(await readFile(dest)) === digest) status = 'identical';
    else {
      const conflict = resolve(root,'migration/conflicts',run,relative(root,dest));
      await mkdir(dirname(conflict), { recursive: true });
      await writeFile(conflict,data,{flag:'wx'});
      status = 'conflict';
    }
  } else {
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest,data,{flag:'wx'});
  }
  report.files.push({ source: relative(source,p).replaceAll('\\','/'), destination: relative(root,dest).replaceAll('\\','/'), sha256: digest, status });
}
await mkdir(resolve(root,'migration/manifests'), {recursive:true});
await writeFile(resolve(root,'migration/manifests',run+'.json'), JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({run,files:report.files.length,conflicts:report.files.filter(f=>f.status==='conflict').length,skills:skillDirs.length}));
