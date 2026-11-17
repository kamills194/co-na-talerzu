// CNT-039: zakładka „Aplikacja” — wykrywanie systemu, kolejność instrukcji, komplet tłumaczeń.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectPlatform, isStandalone, sectionOrder, STEPS, BENEFITS } from '../src/install.js';
import { messages, languageCodes } from '../src/i18n.js';

const src = name => readFile(new URL('../src/' + name, import.meta.url), 'utf8');
const KEYS = ['app','appEyebrow','appTitle','appText','appInstall','appInstalled','appInstallDone','appOpenOnPhone','appYourDevice','appBenefitsTitle',
  'appAndroidTitle','appAndroidBrowser','appIosTitle','appIosBrowser','appIosNote', ...STEPS.android, ...STEPS.ios, ...BENEFITS];

test('detectPlatform: iPhone, iPad (także iPadOS jako Macintosh z dotykiem), Android, komputer', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', 5), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', 0), 'other');
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'), 'android');
  assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0'), 'other');
  assert.equal(detectPlatform(undefined), 'other');
});

test('isStandalone: navigator.standalone (iOS), display-mode standalone, brak matchMedia', () => {
  assert.equal(isStandalone({ navigator: { standalone: true } }), true);
  assert.equal(isStandalone({ navigator: {}, matchMedia: q => ({ matches: q === '(display-mode: standalone)' }) }), true);
  assert.equal(isStandalone({ navigator: {}, matchMedia: () => ({ matches: false }) }), false);
  assert.equal(isStandalone({}), false);
  assert.equal(isStandalone({ get navigator() { throw new Error('x'); } }), false);
});

test('Najpierw instrukcja dla systemu tego urządzenia', () => {
  assert.deepEqual(sectionOrder('ios'), ['ios', 'android']);
  assert.deepEqual(sectionOrder('android'), ['android', 'ios']);
  assert.deepEqual(sectionOrder('other'), ['android', 'ios']);
});

test('Wszystkie teksty zakładki są po polsku i w każdym z siedmiu tłumaczeń', async () => {
  for (const k of KEYS) assert.ok(messages[k], `pl: brak ${k}`);
  for (const code of languageCodes.filter(c => c !== 'pl')) {
    const { messages: m } = await import(new URL(`../src/i18n.${code}.js`, import.meta.url));
    for (const k of KEYS) assert.ok(m[k], `${code}: brak ${k}`);
  }
});

test('Nawigacja ma zakładkę „app”, widok jest renderowany, install.js działa offline', async () => {
  const app = await src('app.js'), sw = await src('sw.js');
  assert.match(app, /\['recipes','favorites','shopping','offers','app'\]/);
  assert.match(app, /else if\(tab==='app'\) appPage\(\)/);
  assert.match(app, /beforeinstallprompt/);
  assert.ok(sw.includes("'./install.js'"));
});
