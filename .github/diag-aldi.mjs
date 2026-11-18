import { writeFile, mkdir } from 'node:fs/promises';
import { robotsDisallows } from '../apps/web/scripts/offer-parser.mjs';
const H={'User-Agent':'Mozilla/5.0 (compatible; CoNaTalerzMVP/0.1; public offers reader; no login)','Accept-Language':'pl-PL,pl;q=0.9','Accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'};
const stores={
  lidl:['https://www.lidl.pl/','https://www.lidl.pl/c/nasze-oferty/a10008785'],
  biedronka:['https://www.biedronka.pl/pl','https://www.biedronka.pl/pl/oferta','https://www.biedronka.pl/pl/gazetki'],
  kaufland:['https://www.kaufland.pl/','https://www.kaufland.pl/oferta/aktualny-tydzien.html','https://www.kaufland.pl/oferta/aktualny-tydzien/przeglad.html'],
  netto:['https://www.netto.pl/','https://www.netto.pl/oferta/'],
  carrefour:['https://www.carrefour.pl/','https://www.carrefour.pl/promocje'],
  auchan:['https://www.auchan.pl/pl','https://zakupy.auchan.pl/promocje'],
  dino:['https://marketdino.pl/','https://marketdino.pl/gazetka'],
  stokrotka:['https://www.stokrotka.pl/','https://www.stokrotka.pl/oferta'],
  penny:['https://www.penny.pl/','https://www.penny.pl/oferty'],
  intermarche:['https://intermarche.pl/','https://intermarche.pl/promocje'],
};
await mkdir('diag',{recursive:true});
const out={};
for(const [store,urls] of Object.entries(stores)){
  const origin=new URL(urls[0]).origin; const r={robots:null,pages:[]};
  try{const x=await fetch(origin+'/robots.txt',{headers:H,signal:AbortSignal.timeout(20000)});r.robotsStatus=x.status;r.robots=(await x.text()).slice(0,3000);}catch(e){r.robotsError=String(e);}
  for(const u of urls){
    await new Promise(z=>setTimeout(z,1000));
    const p={url:u,blocked:r.robots?robotsDisallows(r.robots,new URL(u).pathname):null};
    try{const x=await fetch(u,{headers:H,signal:AbortSignal.timeout(25000)});const t=await x.text();
      Object.assign(p,{status:x.status,final:x.url,type:x.headers.get('content-type'),bytes:t.length,
        nextData:t.includes('__NEXT_DATA__'),nuxt:/__NUXT__|window\.__INITIAL_STATE__|__APOLLO_STATE__/.test(t),
        ldjson:(t.match(/application\/ld\+json/g)||[]).length,offerLd:(t.match(/"@type"\s*:\s*"(Offer|Product|AggregateOffer)"/g)||[]).length,
        prices:(t.match(/\d+[,.]\d{2}\s*(zł|PLN)/g)||[]).length,
        blockedPage:/cf-chl|captcha|Access Denied|Request unsuccessful|Incapsula/i.test(t.slice(0,20000)),
        links:[...new Set([...t.matchAll(/href="([^"]*(?:ofert|promoc|gazet|leaflet|produkt)[^"]*)"/gi)].map(m=>m[1]))].slice(0,40),
        apis:[...new Set([...t.matchAll(/https?:\/\/[a-z0-9.-]+\/[^"'\s]*(?:api|graphql|algolia|search)[^"'\s]*/gi)].map(m=>m[0]))].slice(0,15)});
      await writeFile(`diag/${store}-${urls.indexOf(u)}.txt`,t.slice(0,1.5e6));
    }catch(e){p.error=String(e);}
    r.pages.push(p);
  }
  out[store]=r;
}
await writeFile('diag/stores.json',JSON.stringify(out,null,2));
