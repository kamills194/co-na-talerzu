import { normalize } from '../src/domain.js';
import { markets, marketDate } from '../src/market.js';
// Explicit mappings only. Similar products are not silently treated as identical.
const mappings = new Map([['ogorki szklarniowe','cucumber'],['pomidory malinowe','tomato'],['ziemniaki jadalne salatkowe','potato'],['marchew','carrot'],['cebula','onion'],['banany','banana'],['jablka','apple']]);
// Adapter facts: aldi.pl is the shop's nationwide site for the PL market, prices are in the market
// currency. The page does not state in which regions/shops an offer applies, so the scope is
// reported as unverified — never as nationwide and never with invented regions.
const adapterMarket=markets.PL;
const ALDI_SCOPE=Object.freeze({type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'});
const dateInMarket=epoch=>marketDate(new Date(epoch*1000),adapterMarket);
const text=(v,fallback,max)=>(typeof v==='string'&&v.trim()?v.trim():fallback).slice(0,max);
export function parseAldi(html,{source,now=new Date()}={}) {
  const match=html.match(/<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if(!match) throw Error('Brak publicznych danych __NEXT_DATA__; adapter wymaga aktualizacji.');
  const data=JSON.parse(match[1]), items=[];
  function walk(x) {if(!x||typeof x!=='object')return;if(x.objectID&&x.name)items.push(x);else for(const v of Object.values(x))walk(v);}
  walk(data);
  if(!items.length)throw Error('Nie rozpoznano struktury produktów.');
  const output=new Map(); let skipped=0;
  for(const item of items) {
    const product=mappings.get(normalize(item.name));
    if(!product){skipped++;continue;}
    const candidates=[item.currentPrice,...(Array.isArray(item.promotionPrices)?item.promotionPrices:[])].filter(Boolean);
    for(const p of candidates) {
      const price=p.priceValue,regular=p.strikePrice?.strikePriceValue;
      // Fail closed: price reduction, explicit validity window and active NOW required.
      if(!Number.isFinite(price)||!Number.isFinite(regular)||price<=0||price>=regular||!Number.isFinite(p.validFrom)||!Number.isFinite(p.validUntil)||p.validFrom*1000>now.getTime()||p.validUntil*1000<now.getTime())continue;
      const id=`aldi-${item.objectID}-${p.validFrom}`;
      output.set(id,{id,product,market:adapterMarket.id,currency:adapterMarket.currency,scope:{...ALDI_SCOPE},store:'ALDI',price,until:dateInMarket(p.validUntil),from:dateInMarket(p.validFrom),source,fetchedAt:now.toISOString(),name:text(item.name,'',200),unit:text(item.salesUnit,'Sprawdź jednostkę w źródle',100),regularPrice:regular,validUntil:new Date(p.validUntil*1000).toISOString(),conditions:text(Object.values(p.priceTagLabels||{}).filter(v=>typeof v==='string'&&v.trim()).join(' · '),'Sprawdź warunki w sklepie',500),evidence:JSON.stringify(p)});
    }
  }
  return {offers:[...output.values()],productsSeen:items.length,unmapped:skipped};
}
// robots.txt: consecutive User-agent lines form one group; rules after them apply to every agent
// of that group. Only Disallow is honoured (Allow is ignored, which is the stricter reading).
export function robotsDisallows(robots, path) {
  const rules=[]; let applies=false, inAgents=false;
  for (const raw of String(robots).split(/\r?\n/)) {
    const m=raw.replace(/#.*/,'').trim().match(/^(User-agent|Disallow)\s*:\s*(.*)$/i);
    if(!m) continue;
    if(m[1].toLowerCase()==='user-agent') { if(!inAgents) applies=false; inAgents=true; if(m[2].trim()==='*') applies=true; }
    else { inAgents=false; if(applies&&m[2]) rules.push(m[2].trim()); }
  }
  return rules.some(rule=>{ const anchored=rule.endsWith('$'); const body=anchored?rule.slice(0,-1):rule;
    return new RegExp('^'+body.split('*').map(v=>v.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*')+(anchored?'$':'')).test(path); });
}
