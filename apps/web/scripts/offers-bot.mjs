import { writeFile, rename, mkdir } from 'node:fs/promises';
import { parseAldi, robotsDisallows } from './offer-parser.mjs';
const sources=['https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html','https://www.aldi.pl/produkty/owoce-i-warzywa/owoce.html'];
const now=new Date(), report={version:1,updatedAt:now.toISOString(),offers:[],sources:[]};
const headers={'User-Agent':'CoNaTalerzMVP/0.1 (public offers reader; no login)'};
async function get(url) {
  const r=await fetch(url,{headers,signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!r.ok)throw Error(`HTTP ${r.status}`);
  if(Number(r.headers.get('content-length'))>5e6)throw Error('Odpowiedź zbyt duża');
  const text=await r.text();if(text.length>5e6)throw Error('Odpowiedź zbyt duża');return text;
}
// Honor wildcard disallows; a robots read failure stops collection, no bypasses.
try {
  const robots=await get('https://www.aldi.pl/robots.txt');
  for(const source of sources) {
    try {
      if(robotsDisallows(robots,new URL(source).pathname))throw Error('Odczyt wyłączony przez robots.txt');
      const parsed=parseAldi(await get(source),{source,now});report.offers.push(...parsed.offers);report.sources.push({source,status:'ok',productsSeen:parsed.productsSeen,unmapped:parsed.unmapped});
    }catch(e){report.sources.push({source,status:'error',error:e.message});}
  }
}catch(e){report.sources.push({source:'https://www.aldi.pl/robots.txt',status:'error',error:e.message});}
report.offers=[...new Map(report.offers.map(o=>[o.id,o])).values()];
const dest=new URL('../src/offers.json',import.meta.url), temp=new URL('../src/offers.json.tmp',import.meta.url);
await writeFile(temp,JSON.stringify(report,null,2));await rename(temp,dest);
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await writeFile(new URL('../reports/offers-bot.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({updatedAt:report.updatedAt,offers:report.offers.length,sources:report.sources},null,2));
if(report.sources.some(s=>s.status==='error'))process.exitCode=1;
