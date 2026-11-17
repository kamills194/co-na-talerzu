import { writeFile, rename, mkdir } from 'node:fs/promises';
import { parseAldi, robotsDisallows, extraSources } from './offer-parser.mjs';
import { validAutomaticOffer } from '../src/domain.js';
import { market } from '../src/market.js';
// Department pages confirmed in earlier runs (reports/offers-bot.json). Further food departments of
// the same site can be passed as arguments (`node apps/web/scripts/offers-bot.mjs https://www.aldi.pl/produkty/…html`)
// after their address has been checked on the site; only https://www.aldi.pl/produkty/ pages are accepted,
// each is still checked against robots.txt, and the same parser (__NEXT_DATA__) must recognise it.
const defaultSources=['https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html','https://www.aldi.pl/produkty/owoce-i-warzywa/owoce.html'];
const sources=[...new Set([...defaultSources,...extraSources(process.argv.slice(2))])];
const now=new Date(), report={version:1,market:market.id,currency:market.currency,timeZone:market.timeZone,updatedAt:now.toISOString(),offers:[],sources:[]};
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
      const parsed=parseAldi(await get(source),{source,now});
      // Quarantine: records that do not meet the full offer contract are counted, not published.
      const accepted=parsed.offers.filter(validAutomaticOffer);report.offers.push(...accepted);report.sources.push({source,status:'ok',productsSeen:parsed.productsSeen,unmapped:parsed.unmapped,rejected:parsed.offers.length-accepted.length});
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
