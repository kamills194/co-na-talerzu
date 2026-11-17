# Co na talerz — nowe MVP 0.1.0

Działająca lokalna aplikacja PWA, napisana od podstaw. Polski interfejs, 18 kompletnych autorskich przepisów domowych w sześciu kategoriach, wyszukiwarka, filtrowanie czasu i diety, wykluczenia alergenów i konkretnych produktów, „Zaskocz mnie”, zmiana porcji, ulubione oraz sumowana lista zakupów. Nie potrzebuje konta ani usług zewnętrznych do gotowania.

## Uruchomienie na komputerze

Wymagany Node.js 20 lub nowszy. Uruchom terminal w tym katalogu:

```sh
node scripts/serve.mjs
```

Otwórz **http://localhost:5173**. Nie otwieraj `index.html` dwuklikiem — moduły wymagają serwera HTTP. Aplikacja nie ma zależności do instalowania. Jeśli masz npm, równoważne polecenie to `npm start`. Zatrzymanie serwera: Ctrl+C.

```sh
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs --dist
```

`build` tworzy `dist/` ze źródeł. Serwer jest przeznaczony do lokalnego podglądu, nasłuchuje na wszystkich interfejsach; nie używaj go jako serwera produkcyjnego. Zmiana portu: zmienna `PORT`.

## Telefon

Podłącz telefon i komputer do tej samej zaufanej sieci Wi-Fi. Znajdź lokalny adres IPv4 komputera (Windows: `ipconfig`), następnie otwórz np. `http://192.168.1.20:5173`. Podstawowe funkcje działają przez HTTP w sieci lokalnej; komputer musi być włączony, a zapora umożliwiać połączenie. Nie trzeba wystawiać portu routera do Internetu.

Instalowanie PWA i service worker/offline na telefonie wymagają **HTTPS**. Wyjątek `localhost` dotyczy komputera, nie adresu LAN telefonu. Po umieszczeniu zawartości `dist/` na hostingu HTTPS: Android → menu przeglądarki → instalacja/dodanie do ekranu; iPhone → Safari → Udostępnij → Do ekranu początkowego. Zasoby aplikacji zapisują się po pierwszym udanym załadowaniu online. Oferty wymagają sieci; nie są przechowywane w cache aplikacji. Manifest, PNG 192/512 i ikona SVG są w projekcie.

## Bot promocji

Jednorazowy odczyt rzeczywistych publicznych danych ALDI:

```sh
node scripts/offers-bot.mjs
```

Praca cykliczna na włączonym komputerze, co 6 godzin (Ctrl+C kończy pracę):

```sh
node scripts/offers-watch.mjs
```

Bot sprawdza `robots.txt`, odczytuje dwie strony ALDI (warzywa i owoce) i parsuje publiczny JSON osadzony w HTML. Nie wykonuje skryptów ze strony, nie loguje się i nie omija blokad. Akceptuje tylko promocje z ceną niższą od przekreślonej, jawnym początkiem i końcem oraz małą, jawną mapą produktów do składników. Nie traktuje dowolnego podobnego produktu jako zamiennika. Pomija oferty przyszłe, wygasłe i niekompletne. Podana cena wcześniejsza pochodzi ze źródła; bot nie stwierdza, że to cena regularna ani najniższa na rynku.

Wynik zapisuje atomowo do `src/offers.json`, a raport do `reports/offers-bot.json`. Odśwież stronę, by zobaczyć wynik w zakładce Promocje. Dla `dist/` po odczycie wykonaj ponownie build. Oferty automatyczne znikają po terminie lub po 48 godzinach od odczytu. Bot przy błędzie nie przedłuża ważności starych cen. Raport odróżnia błąd od poprawnego odczytu bez pasujących promocji. To adapter MVP dla jednej sieci, nie pełne pokrycie polskich sklepów. Nie jest uruchomioną usługą chmurową; skrypt `watch` musi pozostawać uruchomiony. Struktura strony sklepu może się zmienić i wymagać poprawy adaptera. Przed komercyjnym wykorzystaniem zapewnij właściwy dostęp do danych i warunki wykorzystania źródeł.

UI pokazuje nazwę produktu sklepowego, jednostkę ceny, odczytane warunki, termin, źródło i czas pobrania. Nigdy nie wylicza całego kosztu dania z niepełnych cen. Dostępność i lokalne warunki trzeba sprawdzić w sklepie. Można też dopisać własną ofertę z datą i źródłem, wyraźnie oddzieloną od odczytów bota.

## Architektura i lokalizacja

- `src/recipes.pl.js` — polska treść przepisów, stabilne ID produktów i ich alergeny.
- `src/i18n.js` — słownik komunikatów oraz formatowanie `pl-PL`. MVP udostępnia wyłącznie polski; dodanie języka wymaga kompletnego słownika, lokalizacji powłoki HTML i polskich stałych redakcyjnych w widokach oraz osobnego katalogu treści tego języka. Nie włączaj języka z niepełnym tłumaczeniem ani cichego mieszania treści.
- `src/domain.js` — czyste funkcje wyszukiwania, wykluczeń, losowania, listy i ważności ofert; bez zależności od DOM.
- `src/storage.js` — wersjonowany lokalny zapis i walidacja kopii danych.
- `src/app.js`, `src/styles.css` — dostępne semantyczne widoki, modal, klawiatura i układ mobilny.
- `scripts/offer-parser.mjs`, `scripts/offers-bot.mjs` — oddzielona ekstrakcja i pobieranie, gotowe do kolejnych adapterów.
- `src/sw.js` — atomowy cache powłoki offline, osobny od danych użytkownika. Build nadaje pamięci podręcznej nazwę z hasha treści; zainstalowana aplikacja sama pobiera nową wersję i odświeża się, gdy użytkownik nie pisze i nie ma otwartego okna.
- `capacitor.config.json` — punkt startowy opakowania mobilnego, `webDir: dist`.

Ulubione, zakupy i własne oferty zapisują się w localStorage. Dane nie synchronizują się między urządzeniami. „Dane i kopia zapasowa” umożliwia eksport/import walidowanego JSON. Wczytanie zastępuje lokalny stan. Dane z formularzy i kopii są escapowane przed wstawieniem do HTML. Alergeny odnoszą się do receptury; etykiety produktów i zanieczyszczenia krzyżowe wymagają osobnego sprawdzenia.

## Testy i wydanie

Testy Node obejmują spójność katalogu, wszystkie kategorie, wyszukiwanie bez polskich znaków, łączenie filtrów, wykluczenia, losowanie bez powtórki, skalowanie i sumowanie, trwałość i import, błędne daty oraz parser i ważność ofert. Przebieg weryfikacji: [TESTY.md](TESTY.md). Publikacja natywna: [PLAN-WYDANIA.md](PLAN-WYDANIA.md). Plik konfiguracyjny Capacitor nie oznacza skompilowanych aplikacji.

## Odzyskana wcześniejsza aplikacja

Po podaniu linku Site udało się pobrać źródła opublikowanego projektu „Co na talerz”, wersja Site 7, commit `b51557c8b3f73ed39698e65634b4621f44b9e7c5`. To osobny, wcześniejszy projekt 0.6.0 z backendem, bazą i projektami natywnymi; zachowano go w archiwum `co-na-talerz-odzyskane-zrodla-v7.zip` obok tego MVP. Nowy projekt nie nadpisuje jego wdrożenia ani bazy. Archiwum zawiera kod, nie eksport danych z produkcyjnej bazy i nie sekrety hostingu. Dalsze scalenie obu kodów wymaga ustalenia docelowej bazy projektu i migracji danych, żeby uniknąć dwóch rozbieżnych wersji.
