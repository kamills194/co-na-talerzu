// Market (where the shops and offers are) is a separate concept from the UI language
// (i18n.js `locale`) and from the currency of a single offer. Only PL is active in the pilot;
// other markets are deliberately absent here — a plan entry does not activate a market.
export const markets = Object.freeze({
  PL: Object.freeze({ id:'PL', locale:'pl-PL', currency:'PLN', timeZone:'Europe/Warsaw', units:'metric' }),
});
export const market = markets.PL;
const dayFormats = new Map();
// Calendar day (YYYY-MM-DD) of an instant in the market time zone, independent of the device zone.
export function marketDate(date=new Date(), m=market) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  let f=dayFormats.get(m.timeZone);
  if (!f) dayFormats.set(m.timeZone, f=new Intl.DateTimeFormat('en-CA',{timeZone:m.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}));
  const p=Object.fromEntries(f.formatToParts(date).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
// `locale` decides digits/separators (UI language); `currency` comes from the offer or the market.
export function formatCurrency(amount, {currency=market.currency, locale=market.locale}={}) {
  return new Intl.NumberFormat(locale,{style:'currency',currency}).format(amount);
}
export function currencySymbol({currency=market.currency, locale=market.locale}={}) {
  return new Intl.NumberFormat(locale,{style:'currency',currency}).formatToParts(0).find(p=>p.type==='currency')?.value || currency;
}
// Display helpers. Unparseable input is returned unchanged (callers still escape it).
export function formatMarketDay(day, locale=market.locale) {
  const time=/^\d{4}-\d{2}-\d{2}$/.test(day) ? Date.parse(day+'T00:00:00Z') : NaN;
  return Number.isNaN(time) ? String(day) : new Intl.DateTimeFormat(locale,{timeZone:'UTC',dateStyle:'medium'}).format(time);
}
export function formatMarketDateTime(iso, locale=market.locale, m=market) {
  const time=typeof iso==='string' ? Date.parse(iso) : NaN;
  return Number.isNaN(time) ? String(iso) : new Intl.DateTimeFormat(locale,{timeZone:m.timeZone,dateStyle:'medium',timeStyle:'short'}).format(time);
}
