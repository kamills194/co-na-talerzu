import { writeFile, mkdir } from 'node:fs/promises';
const H={'User-Agent':'CoNaTalerzMVP/0.1 (public offers reader; no login)','Accept-Language':'pl-PL,pl;q=0.9'};
const urls=['https://www.aldi.pl/robots.txt','https://www.aldi.pl/','https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html','https://www.aldi.pl/produkty/owoce-i-warzywa/owoce.html','https://www.aldi.pl/sitemap.xml','https://www.aldi.pl/oferta.html','https://www.aldi.pl/produkty.html','https://www.aldi.pl/promocje.html'];
await mkdir('diag',{recursive:true});
const summary=[];
for(const [i,u] of urls.entries()){
  try{const r=await fetch(u,{headers:H,signal:AbortSignal.timeout(25000)});const t=await r.text();
    await writeFile(`diag/${String(i).padStart(2,'0')}-${new URL(u).pathname.replace(/[^a-z0-9.]+/gi,'_')||'root'}.txt`,t.slice(0,4e6));
    const links=[...new Set([...t.matchAll(/https?:\/\/www\.aldi\.pl\/[^"'\s<>)]+|"\/(?:produkty|oferta|oferty|promocje|gazetk)[^"'\s<>]*"/g)].map(m=>m[0].replace(/"/g,'')))];
    summary.push({url:u,status:r.status,finalUrl:r.url,type:r.headers.get('content-type'),bytes:t.length,hasNextData:t.includes('__NEXT_DATA__'),links:links.slice(0,400)});
  }catch(e){summary.push({url:u,error:String(e)});}
}
await writeFile('diag/summary.json',JSON.stringify(summary,null,2));
