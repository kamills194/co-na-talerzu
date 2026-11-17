# co na talerzu

Wspólne lokalne repozytorium aplikacji, dokumentacji, backlogu i miejsca na siedem Skills.
GitHub: [kamills194/co-na-talerzu](https://github.com/kamills194/co-na-talerzu).
Google Drive: [co na talerzu](https://drive.google.com/drive/folders/1PYHtPoRuIvv-wyi2jkawOwudBI7y1XbT).
Wspólna wersja to gałąź `main` w GitHub; raporty na Drive wskazują SHA.
Zasady pracy: [docs/WORKFLOW.md](docs/WORKFLOW.md).

Zakres rozwoju: [sześć obszarów i pilotaż w Polsce](docs/PILOT-PL.md) —
30 kompletnych przepisów oraz 30 realnych zdjęć z udokumentowanymi prawami.

Hosting produkcyjny conatalerz.pl (nazwa.pl): [docs/HOSTING-NAZWA-PL.md](docs/HOSTING-NAZWA-PL.md).

Stan integracji i ograniczenia: [docs/STAN-SCALENIA.md](docs/STAN-SCALENIA.md).

Uruchom w terminalu w tym katalogu (Node.js 20 lub nowszy):

```powershell
npm test
npm run build
npm start
```

Aplikacja: http://localhost:5173. Instrukcja funkcji, telefonu i bota ofert:
[apps/web/README.md](apps/web/README.md). Repo nie wymaga instalacji zależności npm.

Jeśli środowisko udostępnia Node bez npm (jak sesja scalania), użyj:

```powershell
node scripts/run.mjs test
node scripts/run.mjs build
node scripts/run.mjs start
```

- `apps/web/` — import istniejącego MVP wraz z testami i dokumentacją aplikacji.
- `.agents/skills/` — siedem dołączonych Skills dostosowanych do wspólnego repo.
- `docs/BACKLOG.md` — jeden backlog i odpowiedzialności siedmiu ról.
- `docs/WORKFLOW.md` — wspólna procedura zadanie → kod → PR → testy → raport → wydanie.
- `migration/manifests/` — pochodzenie i sumy SHA-256 importowanych plików.
- `migration/conflicts/` — kolejne wersje, które wymagają ręcznego scalenia.
- `archive/` — odzyskana wcześniejsza aplikacja, zachowana jako ZIP.
- `project.config.json` — nazwa projektu i rzeczywisty stan integracji.

Kolejne zadania wykonuj w tym katalogu. Otwórz go jako projekt w Codex.
Istniejące czaty nadal wykonują pracę w swoich pierwotnych katalogach; utworzenie
tego repo nie przenosi ich procesu ani nie zmienia automatycznie ich katalogu pracy.
Dołączanie późniejszych wyników: [docs/PRZENIESIENIE.md](docs/PRZENIESIENIE.md).
