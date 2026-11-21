import { products } from './recipes.pl.js';
import { gramsPerUnit } from './nutrition.js';
import { isDisplayableAutomaticOffer, normalize } from './domain.js';

// Only price lines whose quantity and promotion conditions are fully interpretable.
function quote(item, offer) {
  const unit = normalize(offer.unit).replace(/\s*\(.+\)$/, '');
  const conditions = normalize(offer.conditions);
  if (offer.scope.type === 'region' ||
      /\b(kart|kupon|aplikac|klub|limit|przy zakupie|co drug|pakiet|wieloszt|tylko|kaucj|zestaw|od [2-9])/.test(conditions) ||
      !/^(?:bez dodatkowych warunkow\.?|\d+(?:[,.]\d+)?% taniej(?: · .+)?|gazetka [^,]+, strona \d+: (?:cena sprzed obnizki|cena promocyjna).+sprawdz warunki w gazetce i w sklepie\.)$/.test(conditions)) return null;
  const catalogUnit = products[item.product]?.[1];
  const volume = catalogUnit === 'ml';
  const weight = volume ? null : gramsPerUnit(item.product);
  let qty;
  let basis;
  if (/^(?:cena za )?kg$/.test(unit) && weight) {
    qty = Math.round(item.amount * weight) / 1000;
    basis = qty > 0 ? `${qty} kg` : '';
  } else if (/^(?:cena za )?(?:sztuka|szt\.?)$/.test(unit) && catalogUnit === 'szt.') {
    qty = Math.ceil(item.amount);
  } else {
    const match = unit.match(/^(?:opak\.|opakowanie|sloik|sztuka|butelka|puszka)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|szt\.?)$/);
    if (!match) return null;
    const size = Number(match[1].replace(',','.')) * (['kg','l'].includes(match[2]) ? 1000 : 1);
    if (/^szt/.test(match[2]) && catalogUnit === 'szt.') qty = Math.ceil(item.amount / size);
    else if (['g','kg'].includes(match[2]) && weight) qty = Math.ceil(item.amount * weight / size);
    else if (['ml','l'].includes(match[2]) && volume) qty = Math.ceil(item.amount / size);
  }
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return {item, offer, qty, basis, cents:Math.round(qty * Math.round(offer.price * 100))};
}

export function storeBaskets(shopping, offers, now = new Date()) {
  const items = shopping.filter(item => !item.done);
  const stores = new Map();
  for (const offer of offers) {
    if (!isDisplayableAutomaticOffer(offer, now)) continue;
    const store = normalize(offer.store);
    if (!stores.has(store)) stores.set(store,{name:offer.store, offers:[]});
    stores.get(store).offers.push(offer);
  }
  return [...stores.values()].map(store => {
    const lines = [], missing = [];
    for (const item of items) {
      const candidates = store.offers.filter(offer => offer.product === item.product);
      const best = item.product && candidates.map(offer => quote(item,offer)).filter(Boolean).sort((a,b) => a.cents-b.cents)[0];
      if (best) lines.push(best);
      else missing.push({item, conditional:candidates.length > 0});
    }
    return {store:store.name, lines, missing, cents:lines.reduce((sum,line) => sum+line.cents,0)};
  }).sort((a,b) => b.lines.length-a.lines.length || a.cents-b.cents || a.store.localeCompare(b.store,'pl'));
}
