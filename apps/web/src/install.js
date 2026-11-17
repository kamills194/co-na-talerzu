// CNT-039: zakładka „Aplikacja” — wykrywanie systemu i trybu instalacji PWA. Czyste funkcje, bez DOM.
// iPadOS 13+ przedstawia się jako Macintosh; odróżnia go ekran dotykowy (maxTouchPoints > 1).
export function detectPlatform(userAgent = '', maxTouchPoints = 0) {
  const ua = String(userAgent);
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}
// Aplikacja uruchomiona z ekranu głównego: display-mode standalone (Android, nowsze iOS) albo navigator.standalone (Safari iOS).
export function isStandalone(win = globalThis) {
  try {
    if (win.navigator?.standalone === true) return true;
    return !!win.matchMedia?.('(display-mode: standalone)')?.matches;
  } catch { return false; }
}
// Kolejność sekcji: najpierw system tego urządzenia.
export function sectionOrder(platform) { return platform === 'ios' ? ['ios', 'android'] : ['android', 'ios']; }
export const STEPS = { android: ['appAndroid1', 'appAndroid2', 'appAndroid3', 'appAndroid4'], ios: ['appIos1', 'appIos2', 'appIos3', 'appIos4'] };
export const BENEFITS = ['appBenefit1', 'appBenefit2', 'appBenefit3', 'appBenefit4'];
