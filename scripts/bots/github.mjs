// Wspólne funkcje botów: zgłoszenia (Issues) w repozytorium przez GitHub REST API.
// Wymaga GITHUB_TOKEN i GITHUB_REPOSITORY (ustawiane przez GitHub Actions). Bez nich działa „na sucho”:
// wypisuje, co by zrobił, i niczego nie zmienia (DRY_RUN=1 wymusza ten tryb).
const API = 'https://api.github.com';
const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPOSITORY;
export const dryRun = !token || !repo || process.env.DRY_RUN === '1';

async function gh(method, path, body) {
  if (dryRun) { console.log(`[na sucho] ${method} ${path}${body ? ' ' + JSON.stringify(body).slice(0, 300) : ''}`); return method === 'GET' ? [] : {}; }
  const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'conatalerz-bot' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw Error(`GitHub ${method} ${path}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? {} : r.json();
}

export async function ensureLabel(name, color, description) {
  try { await gh('POST', `/repos/${repo}/labels`, { name, color, description }); }
  catch (e) { if (!/HTTP 422/.test(e.message)) throw e; }
}
// Zgłoszenia z etykietą (otwarte i zamknięte), bez pull requestów. Do 500 najnowszych.
export async function issuesWithLabel(label, state = 'all') {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh('GET', `/repos/${repo}/issues?labels=${encodeURIComponent(label)}&state=${state}&per_page=100&page=${page}&sort=updated`);
    out.push(...batch.filter(i => !i.pull_request));
    if (batch.length < 100) break;
  }
  return out;
}
export const marker = id => `<!-- bot:${id} -->`;
export const findByMarker = (issues, id) => issues.find(i => (i.body || '').includes(marker(id)));
export const createIssue = (title, body, labels) => gh('POST', `/repos/${repo}/issues`, { title: title.slice(0, 250), body, labels });
export const comment = (number, body) => gh('POST', `/repos/${repo}/issues/${number}/comments`, { body });
export const updateIssue = (number, patch) => gh('PATCH', `/repos/${repo}/issues/${number}`, patch);
export const runUrl = () => process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '(lokalnie)';
// Tekst z danych zewnętrznych w Markdown: bez wzmianek @, bez zamykania bloków kodu.
export const safe = s => String(s ?? '').replace(/@/g, '@​').replace(/```/g, 'ˋˋˋ');
