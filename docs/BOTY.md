# Boty projektu (GitHub Actions)

Boty działają w GitHub Actions — nie wymagają włączonego komputera. Wyniki trafiają do zakładki
**Issues** (zgłoszenia z etykietami `bot: …`) oraz **Pull requests**. GitHub wysyła właścicielowi
repozytorium powiadomienia e-mail o nowych zgłoszeniach (Settings → Notifications).

| Bot | Plik | Kiedy | Co robi |
| --- | --- | --- | --- |
| Monitor strony | `bot-monitor.yml` → `scripts/bots/monitor.mjs` | co 30 min i po każdym wdrożeniu | Sprawdza conatalerz.pl: HTTP 200, przekierowania http→https i www→bez www, wszystkie pliki z listy offline (status i typ MIME), manifest, `offers.json`, `report.php`, blokadę `_reports`, ważność SSL (alarm < 14 dni), zgodność wdrożonej wersji z `main`. Awaria → jedno zgłoszenie `bot: monitor`, zamykane automatycznie po naprawie. |
| Błędy ze strony | `bot-errors.yml` → `scripts/bots/collect-errors.mjs` | co godzinę | Pobiera przez SFTP zgłoszenia zebrane przez `report.php`, grupuje ten sam błąd i zakłada zgłoszenie `bot: błąd strony` (kolejne wystąpienia jako komentarz; zamknięte zgłoszenie otwiera ponownie, gdy błąd wróci). Pomija szum (rozszerzenia przeglądarek, „Script error.”, zerwane połączenia). |
| Redaktor treści | `bot-editor.yml` → `scripts/bots/editor.mjs` | codziennie 5:41 (PL) | Bezpieczne poprawki tekstu (podwójne spacje, spacja przed przecinkiem/kropką, „...” → „…”) w pull requeście po przejściu testów (jeśli repozytorium nie pozwala Actions zakładać PR — Settings → Actions → General → „Allow GitHub Actions to create and approve pull requests” — bot zostawia gałąź `bot/redakcja-…` i link do utworzenia PR w zgłoszeniu). Raport braków tłumaczeń, powtórzonych słów, nawiasów, kroków bez kropki, polskiego tekstu w tłumaczeniach i nieaktualnych ofert — w jednym zgłoszeniu `bot: redakcja`. Nie zmienia ilości, czasów, alergenów ani identyfikatorów. |
| Kucharz (nowe dania) | `bot-chef.yml` → `scripts/bots/chef.mjs` | co godzinę; po osiągnięciu celu raz na dobę | Dopisuje sprawdzone dania z 23 regionów (najpierw najmniej liczne kuchnie) i warianty popularnych dań (np. pierogi z mięsem obok ruskich), aż katalog ma co najmniej 600 pozycji (`RECIPE_BOT_TARGET`). Szczegóły niżej. |
| Oferty | `bot-offers.yml` → `apps/web/scripts/offers-bot.mjs` | co 6 h | Odczytuje publiczne oferty ALDI (z poszanowaniem robots.txt), zapisuje `offers.json` w `main`, gdy oferty się zmienią, i uruchamia wdrożenie. |

## Bot „kucharz” — jak sprawdza dania

1. **Wybór**: region spośród trzech najmniej licznych kuchni (`cuisines` w `recipes.pl.js`, 23 regiony — m.in. chińska,
   tajska, wietnamska, koreańska, hiszpańska, portugalska, turecka, węgierska, ukraińska, gruzińska, brytyjska,
   skandynawska, latynoamerykańska, afrykańska). Co drugi przebieg dodaje też 2 warianty losowego dania (pole `variantOf`).
2. **Propozycja** (model `RECIPE_BOT_MODEL`, domyślnie `claude-opus-5-5`): danie w formacie katalogu — produkty z katalogu
   albo nowe produkty z alergenami, rodzajem (`plant/dairy/egg/meat/fish/animal`), wartościami odżywczymi i nazwami
   w 7 językach; kroki i nazwy we wszystkich 8 językach.
3. **Walidacja w kodzie** (`scripts/bots/chef-validate.mjs`): alergeny przepisu i flagi wegańskie/wegetariańskie
   bot **liczy sam** z produktów (model nie może ich ustawić); odrzuca skorupiaki, mięczaki, orzeszki ziemne, łubin
   i siarczyny (aplikacja nie ma takich alergenów), duplikaty nazw i ID, złe jednostki, różną liczbę kroków w językach,
   znaki HTML, błędy redakcyjne (te same reguły co redaktor), kcal na porcję spoza 40–1500. Błędny rekord model poprawia raz.
4. **Weryfikacja** (model `RECIPE_BOT_REVIEW_MODEL`, domyślnie `claude-sonnet-5-5`, z wyszukiwarką internetową):
   czy to prawdziwe danie regionu, czy proporcje, czas i kroki są zgodne ze źródłami, czy kroki są bezpieczne.
   Danie przechodzi tylko z co najmniej jednym źródłem, którego adres **naprawdę był w wynikach wyszukiwania**
   (zapisane w polu `sources`).
5. **Zapis**: `apps/web/src/recipes.bot.<język>.js` (pliki generowane, nie edytować ręcznie), raport z odrzuconymi
   daniami i powodami w `apps/web/reports/chef-bot.json`. Workflow uruchamia `npm test`; commit do `main`
   i wdrożenie tylko po przejściu wszystkich testów, inaczej zgłoszenie `bot: kucharz`.

Dania bota mają `review:'bot'` (nie były testowane w kuchni ani czytane przez redakcję); redakcja może je
przenieść do `recipes.pl.js`. Produkty bota nie mają reguł dopasowania ofert (`offer-parser.mjs` — celowo
„fail-closed”); regułę dodaje redakcja.

**Uruchomienie**: dodaj sekret `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions). Ręcznie:
Actions → „Bot: kucharz” → Run workflow (opcjonalnie kuchnia i liczba dań). Lokalnie bez zapisu:
`ANTHROPIC_API_KEY=… node scripts/bots/chef.mjs --dry --region korean --batch 2`.

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
