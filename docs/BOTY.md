# Boty projektu (GitHub Actions)

Boty działają w GitHub Actions — nie wymagają włączonego komputera. Wyniki trafiają do zakładki
**Issues** (zgłoszenia z etykietami `bot: …`) oraz **Pull requests**. GitHub wysyła właścicielowi
repozytorium powiadomienia e-mail o nowych zgłoszeniach (Settings → Notifications).

| Bot | Plik | Kiedy | Co robi |
| --- | --- | --- | --- |
| Monitor strony | `bot-monitor.yml` → `scripts/bots/monitor.mjs` | co 30 min i po każdym wdrożeniu | Sprawdza conatalerz.pl: HTTP 200, przekierowania http→https i www→bez www, wszystkie pliki z listy offline (status i typ MIME), manifest, `offers.json`, `report.php`, blokadę `_reports`, ważność SSL (alarm < 14 dni), zgodność wdrożonej wersji z `main`. Awaria → jedno zgłoszenie `bot: monitor`, zamykane automatycznie po naprawie. |
| Błędy ze strony | `bot-errors.yml` → `scripts/bots/collect-errors.mjs` | co godzinę | Pobiera przez SFTP zgłoszenia zebrane przez `report.php`, grupuje ten sam błąd i zakłada zgłoszenie `bot: błąd strony` (kolejne wystąpienia jako komentarz; zamknięte zgłoszenie otwiera ponownie, gdy błąd wróci). Pomija szum (rozszerzenia przeglądarek, „Script error.”, zerwane połączenia). |
| Redaktor treści | `bot-editor.yml` → `scripts/bots/editor.mjs` | codziennie 5:41 (PL) | Bezpieczne poprawki tekstu (podwójne spacje, spacja przed przecinkiem/kropką, „...” → „…”) w pull requeście po przejściu testów (jeśli repozytorium nie pozwala Actions zakładać PR — Settings → Actions → General → „Allow GitHub Actions to create and approve pull requests” — bot zostawia gałąź `bot/redakcja-…` i link do utworzenia PR w zgłoszeniu). Raport braków tłumaczeń, powtórzonych słów, nawiasów, kroków bez kropki, polskiego tekstu w tłumaczeniach i nieaktualnych ofert — w jednym zgłoszeniu `bot: redakcja`. Nie zmienia ilości, czasów, alergenów ani identyfikatorów. |
| Oferty | `bot-offers.yml` → `apps/web/scripts/offers-bot.mjs` | co 6 h | Odczytuje publiczne oferty ALDI (z poszanowaniem robots.txt; pusta kategoria to status `empty`, nie błąd), zapisuje `offers.json` w `main`, gdy oferty się zmienią, i uruchamia wdrożenie. |

## Zbieranie błędów ze strony

`apps/web/src/errors.js` (ładowany przed `app.js`) przechwytuje nieobsłużone błędy JavaScript,
odrzucone obietnice i niewczytane skrypty/style — tylko na `conatalerz.pl`, najwyżej 5 różnych
na wizytę. Wysyła komunikat, plik, wiersz, stos, zakładkę, język, przeglądarkę i informację,
czy to zainstalowana aplikacja. **Nie** wysyła ulubionych, listy zakupów, wpisów ani adresu strony
z parametrami. `deploy/nazwa.pl/report.php` zapisuje zgłoszenia do `_reports/` (zablokowany dla WWW),
nie zapisuje adresu IP, ogranicza liczbę zgłoszeń (30/h z jednego adresu, 5 MB/dobę).
Informacja dla użytkownika jest w oknie „Dane i kopia zapasowa” (`privacyErrors`).

## Uruchomienie ręczne

Actions → wybierz bota → **Run workflow**. Lokalnie (bez tokenu działają „na sucho”, nic nie zmieniają):

```sh
node scripts/bots/editor.mjs           # raport redakcyjny
node scripts/bots/editor.mjs --fix     # zapisz bezpieczne poprawki w plikach
node scripts/bots/monitor.mjs          # sprawdzenie conatalerz.pl
node scripts/bots/collect-errors.mjs katalog-z-plikami-jsonl
```
