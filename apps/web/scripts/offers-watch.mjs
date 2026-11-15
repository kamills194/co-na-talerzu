import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let running=false;
function run(){if(running)return;running=true;const child=spawn(process.execPath,[fileURLToPath(new URL('./offers-bot.mjs',import.meta.url))],{stdio:'inherit'});child.on('exit',code=>{running=false;if(code)console.error('Odczyt niepełny. Szczegóły w reports/offers-bot.json.');});child.on('error',e=>{running=false;console.error(e.message);});}
run();setInterval(run,6*60*60*1000);
console.log('Bot działa co 6 godzin. Zatrzymanie: Ctrl+C. Komputer musi być włączony.');
