import { writeFile, rename, mkdir } from 'node:fs/promises';
import { parseAldi, robotsDisallows, extraSources } from './offer-parser.mjs';
import { validAutomaticOffer, validDeal } from '../src/domain.js';
import { market } from '../src/market.js';
// Sources confirmed by the CNT-040 diagnostic run in GitHub Actions (2026-11-17): the weekly offers
// page plus the food sub-departments whose products appear in recipes. Top-level department pages
// only show tiles, so the sub-department pages are listed. Further pages can be passed as arguments.
const base='https://www.aldi.pl';
const sub=['owoce-i-warzywa/warzywa','owoce-i-warzywa/owoce','owoce-i-warzywa/grzyby','owoce-i-warzywa/swieze-ziola-i-kielki','owoce-i-warzywa/bakalie',
  'nabial-i-jaja/mleko','nabial-i-jaja/smietana','nabial-i-jaja/jogurty','nabial-i-jaja/kefiry-i-maslanki','nabial-i-jaja/maslo','nabial-i-jaja/jaja',
  'sery-i-twarogi/sery-zolte','sery-i-twarogi/sery-salatkowe-i-kanapkowe','sery-i-twarogi/twarog','sery-i-twarogi/serki-wiejskie',
  'wedliny-i-mieso/mieso-drobiowe','wedliny-i-mieso/mieso-wieprzowe','wedliny-i-mieso/mieso-wolowe','wedliny-i-mieso/kielbasy-i-kaszanki','wedliny-i-mieso/szynki--wedzonki',
  'ryby/ryby-swieze','ryby/ryby-mrozone','ryby/ryby-wedzone','ryby/konserwy-rybne--przetwory-rybne',
  'pieczywo/chleb','pieczywo/bulki-i-bagietki','pieczywo/pieczywo-tostowe',
  'produkty-sypkie-i-zbozowe/makarony','produkty-sypkie-i-zbozowe/kasze','produkty-sypkie-i-zbozowe/ryz','produkty-sypkie-i-zbozowe/maka','produkty-sypkie-i-zbozowe/straczki','produkty-sypkie-i-zbozowe/cukier',
  'produkty-sniadaniowe/platki','przetwory/ogorki','przetwory/oliwki','przetwory/groszek--kukurydza--fasolka','przetwory/dzemy--konfitury--powidla','przetwory/miody',
  'tluszcze-i-octy/maslo--margaryna','tluszcze-i-octy/olej','tluszcze-i-octy/oliwa-z-oliwek','tluszcze-i-octy/ocet',
  'przyprawy/ziola--mieszanki-ziolowe','przyprawy/inne-przyprawy','przyprawy/przyprawy-w-plynie',
  'sosy--dressingi-i-przeciery/koncentraty--przeciery','sosy--dressingi-i-przeciery/pesto','sosy--dressingi-i-przeciery/musztarda',
  'produkty-do-pieczenia/proszek-do-pieczenia--soda','produkty-do-pieczenia/drozdze','produkty-do-pieczenia/kisiele--budynie','produkty-do-pieczenia/kakao',
  'mrozonki-i-dania-gotowe/mrozone-warzywa','mrozonki-i-dania-gotowe/mrozone-owoce','slodycze/czekolady','slodycze/biszkopty--herbatniki','kawa/kawa-mielona'];
const defaultSources=[`${base}/oferty.html`,...sub.map(p=>`${base}/produkty/${p}.html`)];
const sources=[...new Set([...defaultSources,...extraSources(process.argv.slice(2))])];
const now=new Date(), report={version:1,market:market.id,currency:market.currency,timeZone:market.timeZone,updatedAt:now.toISOString(),offers:[],deals:[],sources:[]};
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
    await new Promise(r=>setTimeout(r,1200)); // be polite: one page at a time, ~1 request per second
    try {
      if(robotsDisallows(robots,new URL(source).pathname))throw Error('Odczyt wyłączony przez robots.txt');
      const parsed=parseAldi(await get(source),{source,now});
      // Quarantine: records that do not meet the full offer contract are counted, not published.
      const accepted=parsed.offers.filter(validAutomaticOffer);report.offers.push(...accepted);
      // CNT-041: every current food promotion for the store view, under its own contract.
      const acceptedDeals=parsed.deals.filter(validDeal);report.deals.push(...acceptedDeals);
      report.sources.push({source,status:'ok',productsSeen:parsed.productsSeen,unmapped:parsed.unmapped,rejected:parsed.offers.length-accepted.length,deals:acceptedDeals.length,rejectedDeals:parsed.deals.length-acceptedDeals.length});
    }catch(e){report.sources.push({source,status:'error',error:e.message});}
  }
}catch(e){report.sources.push({source:'https://www.aldi.pl/robots.txt',status:'error',error:e.message});}
report.offers=[...new Map(report.offers.map(o=>[o.id,o])).values()];
report.deals=[...new Map(report.deals.map(d=>[d.id,d])).values()];
const dest=new URL('../src/offers.json',import.meta.url), temp=new URL('../src/offers.json.tmp',import.meta.url);
await writeFile(temp,JSON.stringify(report,null,2));await rename(temp,dest);
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await writeFile(new URL('../reports/offers-bot.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({updatedAt:report.updatedAt,offers:report.offers.length,deals:report.deals.length,sources:report.sources},null,2));
// A single failing page must not discard the rest; the run fails only when nothing could be read.
if(!report.sources.some(s=>s.status==='ok'))process.exitCode=1;
