// Reguły redakcyjne bota redaktora (scripts/bots/editor.mjs). Czyste funkcje, testy: apps/web/tests/bots.test.mjs.
// ---------- Reguły redakcyjne ----------
// Francuski stawia spację (zwykle niełamliwą) przed ; : ! ? — tej reguły tam nie stosujemy.
export function tidy(text, lang) {
  let s = String(text);
  s = s.replace(/\.\.\./g, '…');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(lang === 'fr' ? / +([,.…])(?!\d)/g : / +([,.;:!?…])(?!\d)/g, '$1');
  s = s.split('\n').map(l => l.trim()).join('\n');
  return s;
}
// Do ręcznego przejrzenia (bez automatycznej poprawki).
export function lint(text, lang) {
  const s = String(text), out = [];
  const dup = /(^|[\s(„"«])([\p{L}]{2,})\s+\2(?=[\s,.;:!?)”"»]|$)/iu.exec(s);
  if (dup && !/^(ha|na|no|si|so|ta|tak|bye|very)$/i.test(dup[2])) out.push(`powtórzone słowo „${dup[2]}”`);
  if (/[(\[{]\s*$|^\s*[)\]}]/.test(s)) out.push('niedomknięty nawias');
  const open = (s.match(/\(/g) || []).length, close = (s.match(/\)/g) || []).length;
  if (open !== close) out.push('liczba nawiasów ( ) się nie zgadza');
  if (lang !== 'pl' && /[ąćęłńśźż]/i.test(s) && !['uk'].includes(lang) && !/conatalerz|Co na talerz|gzik|pierogi|żurek|bigos|placki|kopytka|łazanki|naleśniki|zupa|ogórkow|pomidorow|kluski|leniwe|gołąbki|racuchy|kotlet|schabow|mizeria|twaróg|twarożek|kasza|oscypek|faworki|pączki|szarlotka|sernik|kompot|barszcz|rosół|krupnik|flaki|zapiekanka|knedle|grzanki|kisiel|jajecznica|kanapki/i.test(s)) out.push('polskie znaki w tłumaczeniu — czy tekst nie został po polsku?');
  return out;
}

