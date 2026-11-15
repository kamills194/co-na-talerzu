import { recipes, products } from './recipes.pl.js';
import { validOffer } from './domain.js';
export const KEY='co-na-talerz:v1';
export const emptyState=()=>({version:1,favorites:[],shopping:[],offers:[]});
export function validateState(s) {
  if(!s || s.version!==1 || !['favorites','shopping','offers'].every(k=>Array.isArray(s[k])&&s[k].length<=2000)) throw Error('Invalid backup');
  const ids=new Set(recipes.map(r=>r.id));
  if(!s.favorites.every(id=>ids.has(id)) || new Set(s.favorites).size!==s.favorites.length) throw Error('Invalid favorites');
  if(!s.shopping.every(i=>i && typeof i.id==='string' && i.id.length<=100 && typeof i.done==='boolean' && (i.product ? i.product in products && i.id===i.product && Number.isFinite(i.amount)&&i.amount>0&&i.amount<1e9 : typeof i.name==='string'&&i.name.trim()&&i.name.length<=120))) throw Error('Invalid shopping');
  if(new Set(s.shopping.map(i=>i.id)).size!==s.shopping.length || !s.offers.every(validOffer) || new Set(s.offers.map(i=>i.id)).size!==s.offers.length) throw Error('Invalid entries');
  return {version:1,favorites:[...s.favorites],shopping:s.shopping.map(i=>i.product?{id:i.id,product:i.product,amount:i.amount,done:i.done}:{id:i.id,name:i.name,done:i.done}),offers:s.offers.map(({id,product,store,price,until,source})=>({id,product,store,price,until,source}))};
}
export function load(storage) { const raw=storage.getItem(KEY); return raw ? validateState(JSON.parse(raw)) : emptyState(); }
export function save(storage,state) { storage.setItem(KEY,JSON.stringify(validateState(state))); }
