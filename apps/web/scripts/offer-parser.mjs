import { normalize } from '../src/domain.js';
// Explicit mappings only. Similar products are not silently treated as identical.
const mappings = new Map([['ogorki szklarniowe','cucumber'],['pomidory malinowe','tomato'],['ziemniaki jadalne salatkowe','potato'],['marchew','carrot'],['cebula','onion'],['banany','banana'],['jablka','apple']]);
function dateWarsaw(epoch) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(epoch*1000)); }
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
      output.set(id,{id,product,store:'ALDI',price,until:dateWarsaw(p.validUntil),from:dateWarsaw(p.validFrom),source,fetchedAt:now.toISOString(),name:item.name,unit:item.salesUnit||'Sprawdź jednostkę w źródle',regularPrice:regular,validUntil:new Date(p.validUntil*1000).toISOString(),conditions:Object.values(p.priceTagLabels||{}).filter(v=>typeof v==='string').join(' · ')||'Sprawdź warunki w sklepie',evidence:JSON.stringify(p)});
    }
  }
  return {offers:[...output.values()],productsSeen:items.length,unmapped:skipped};
}
