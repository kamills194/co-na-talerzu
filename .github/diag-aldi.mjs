import { writeFile, mkdir } from 'node:fs/promises';
import { parseAldi, robotsDisallows } from '../apps/web/scripts/offer-parser.mjs';
const H={'User-Agent':'CoNaTalerzMVP/0.1 (public offers reader; no login)','Accept-Language':'pl-PL,pl;q=0.9'};
const deps=['ryby','pieczywo','nabial-i-jaja','wedliny-i-mieso','sery-i-twarogi','mrozonki-i-dania-gotowe','produkty-sniadaniowe','produkty-sypkie-i-zbozowe','przetwory','tluszcze-i-octy','przyprawy','sosy--dressingi-i-przeciery','produkty-do-pieczenia','owoce-i-warzywa','slodycze','napoje-i-soki','kawa'];
const urls=['https://www.aldi.pl/oferty.html',...deps.map(d=>`https://www.aldi.pl/produkty/${d}.html`)];
await mkdir('diag',{recursive:true});
const robots=await (await fetch('https://www.aldi.pl/robots.txt',{headers:H})).text();
const now=new Date(), out=[];
for(const u of urls){
  const e={url:u,robotsBlocked:robotsDisallows(robots,new URL(u).pathname)};
  try{const r=await fetch(u,{headers:H,signal:AbortSignal.timeout(25000)});const t=await r.text();e.status=r.status;e.bytes=t.length;
    e.links=[...new Set([...t.matchAll(/"(\/(?:produkty|oferty)\/[^"\\\s<>?#]+)/g)].map(m=>m[1]))].slice(0,120);
    try{const p=parseAldi(t,{source:u,now});e.productsSeen=p.productsSeen;e.unmapped=p.unmapped;e.offers=p.offers.map(o=>`${o.product}: ${o.name} ${o.price} (${o.from}–${o.until})`);}catch(x){e.parseError=String(x.message);}
    // raw promo stats regardless of mapping
    const m=t.match(/<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if(m){const items=[];(function w(x){if(!x||typeof x!=='object')return;if(x.objectID&&x.name)items.push(x);else for(const v of Object.values(x))w(v);})(JSON.parse(m[1]));
      e.items=items.length;e.reduced=items.filter(i=>[i.currentPrice,...(i.promotionPrices||[])].some(p=>p&&p.strikePrice&&p.priceValue<p.strikePrice.strikePriceValue)).map(i=>i.name).slice(0,60);
      e.totalHits=JSON.stringify(JSON.parse(m[1])).match(/"(nbHits|totalHits|total|totalCount)":\s*(\d+)/g)?.slice(0,5);}
    if(u.endsWith('oferty.html'))await writeFile('diag/oferty.html.txt',t.slice(0,4e6));
  }catch(x){e.error=String(x);}
  out.push(e);
}
await writeFile('diag/summary2.json',JSON.stringify(out,null,2));
