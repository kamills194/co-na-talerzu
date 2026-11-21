import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extraRecipes, mappedExtraItem} from '../src/extra-catalog.js';
import {filterRecipes} from '../src/domain.js';
import {recipes} from '../src/recipes.pl.js';
import {emptyState,validateState} from '../src/storage.js';
import {storeBaskets} from '../src/baskets.js';

test('430 nowych przepisów z pochodzeniem, w tym kluski śląskie i tłumaczenia EN', () => {
  const pl=extraRecipes('pl'), en=extraRecipes('en');
  assert.equal(pl.length,430);
  assert.equal(en.length,358);
  assert.equal(extraRecipes('de').length,0);
  assert.equal(new Set([...recipes,...pl].map(r=>r.id)).size,545);
  assert.ok(new Set(pl.map(r=>r.cuisine)).size>=20);
  assert.ok(pl.every(r=>r.steps.length>=3&&r.items.length>=3&&r.source.startsWith('https://')&&r.credit&&r.license));
  const dumplings=filterRecipes(pl,{query:'kluski slaskie'}).find(r=>r.name==='Kluski śląskie');
  assert.ok(dumplings);
  assert.equal(filterRecipes([dumplings],{diet:'glutenFree'}).length,0);
  assert.equal(filterRecipes([dumplings],{excluded:['peanuts']}).length,0);
  assert.deepEqual(validateState({...emptyState(),favorites:[dumplings.id]}).favorites,[dumplings.id]);
  const lookup=new Map([['ziemniaki',['potato','g']],['jajko',['egg','szt.']]]);
  assert.deepEqual(mappedExtraItem(dumplings.items[0],lookup),{product:'potato',amount:1000});
  assert.equal(mappedExtraItem(['jajko',200,'g'],lookup),null);
  assert.equal(mappedExtraItem(['ziemniaki ugotowane',500,'g'],lookup),null);
});

test('Koszyk wycenia tylko porównywalną jednostkę i aktualną ofertę w danym sklepie',()=>{
  const now=new Date('2026-11-21T13:00:00Z');
  const base={store:'ALDI',market:'PL',currency:'PLN',from:'2026-11-21',until:'2026-11-23',
    fetchedAt:'2026-11-21T10:00:00Z',validUntil:'2026-11-23T22:59:59Z',conditions:'Bez dodatkowych warunków',
    source:'https://www.aldi.pl/',scope:{type:'nationwide'}};
  const offer=(product,unit,price,other={})=>({...base,id:product,product,unit,price,name:product,...other});
  const list=[{id:'potato',product:'potato',amount:1150,done:false},
    {id:'butter',product:'butter',amount:400,done:false},{id:'milk',product:'milk',amount:500,done:false},
    {id:'egg',product:'egg',amount:10,done:true},{id:'local',name:'Mięta',done:false}];
  const offers=[offer('potato','Cena za kg',3.49),offer('potato','Opak. 2,5 kg',5.49,{store:'Lidl'}),
    offer('butter','Opak. 200 g',4.99),offer('milk','Opak. 500 g',2.49),
    offer('milk','Opak. 1 l',0.99,{conditions:'Przy zakupie 2 szt.'}),offer('egg','Opak. 10 szt.',2.99),
    offer('potato','Cena za kg',1.00,{store:'Wygasłe',from:'2026-11-19',until:'2026-11-20',validUntil:'2026-11-20T22:59:59Z'})];
  const [aldi,lidl]=storeBaskets(list,offers,now);
  assert.equal(aldi.store,'ALDI');
  assert.equal(aldi.cents,1399);
  assert.deepEqual(aldi.lines.map(l=>l.qty),[1.15,2]);
  assert.deepEqual(aldi.missing.map(x=>[x.item.id,x.conditional]),[['milk',true],['local',false]]);
  assert.equal(lidl.store,'Lidl');
  assert.equal(lidl.lines[0].qty,1);
  assert.equal(lidl.cents,549);
  assert.equal(storeBaskets(list,offers,now).length,2);
});
