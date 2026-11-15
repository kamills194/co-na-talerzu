import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../apps/web/',import.meta.url));
const task = process.argv[2];
const args = task === 'test' ? ['--test', ...(await readdir(new URL('../apps/web/tests/',import.meta.url))).filter(n=>n.endsWith('.test.mjs')).map(n=>'tests/'+n)] :
  ({start:['scripts/serve.mjs'],build:['scripts/build.mjs'],offers:['scripts/offers-bot.mjs']})[task];
if (!args) throw Error('Usage: node scripts/run.mjs start|test|build|offers');
const child = spawn(process.execPath,args,{cwd,stdio:'inherit'});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code ?? 1;});
