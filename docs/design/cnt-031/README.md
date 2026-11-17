# CNT-031 — bajkowa szata graficzna: trzy warianty do wyboru

Data: 2026-11-17. Życzenie właściciela: wygląd bardziej bajkowy i przyjemny dla oka, z wyborem
spośród 2–3 wariantów, zanim cokolwiek zmieni się dla użytkowników. **Żaden wariant nie jest
podłączony do aplikacji** — to arkusze do podglądu.

Każdy wariant to samodzielna warstwa CSS nakładana **po** `styles.css`: nadpisuje zmienne kolorów
(`--green`, `--ink`, `--paper`, `--muted`, `--border`, `--orange`, `--white`), czcionki, kształty,
cienie i tła. Nie zmienia HTML ani JavaScriptu, więc aplikacja działa z każdym z nich (albo bez żadnego).
Wszystkie grafiki to gradienty CSS i proste, własnoręcznie narysowane SVG w data URI (chmurki,
gwiazdki, listki, chorągiewki, kropkowane linie) — bez postaci, cudzych ilustracji i znaków
towarowych. Czcionki wyłącznie systemowe: nic nie jest pobierane z sieci, działa offline.

| Wariant | Plik | Telefon (390 px) | Komputer (1280 px) |
| --- | --- | --- | --- |
| Obecny wygląd (porównanie) | `apps/web/src/styles.css` | [current-mobile.png](current-mobile.png) | — |
| A. Bajkowa pastelowa | [themes/bajkowa-pastel.css](themes/bajkowa-pastel.css) | [pastel-mobile.png](pastel-mobile.png) | [pastel-desktop.png](pastel-desktop.png) |
| B. Bajkowa książeczka | [themes/bajkowa-ksiazeczka.css](themes/bajkowa-ksiazeczka.css) | [ksiazeczka-mobile.png](ksiazeczka-mobile.png) | [ksiazeczka-desktop.png](ksiazeczka-desktop.png) |
| C. Bajkowy ogród | [themes/bajkowa-ogrod.css](themes/bajkowa-ogrod.css) | [ogrod-mobile.png](ogrod-mobile.png) | [ogrod-desktop.png](ogrod-desktop.png) |

Zrzuty: ekran „Przepisy” (strona główna), headless Chrome, czcionki zastępcze środowiska Linux
(na telefonie z iOS/Androidem i na Windows/macOS litery będą wyglądać nieco inaczej — patrz niżej).

## A. Bajkowa pastelowa

- **Nastrój:** lekkie, „watowe” niebo o świcie — lawenda, róż, brzoskwinia, białe chmurki i iskierki.
  Najbardziej miękki i dziecięco-radosny wariant.
- **Paleta:** tekst `#33284f` (głęboka śliwka), tło `#fdf8fc` z gradientem lawenda → róż, kolor główny
  `#5b3f9e` (lawendowy fiolet), akcent `#a3325c` (malina), obrysy kontrolek `#8d7bb3`, fokus `#c0306f`.
  Tła kart kategorii: maślane, miętowe, błękitne, różowe, brzoskwiniowe, liliowe.
- **Typografia:** zaokrąglony krój systemowy (`ui-rounded` / SF Pro Rounded na Apple; na innych
  systemach zwykły systemowy bezszeryfowy), pogrubione nagłówki zamiast Georgii.
- **Co się zmienia:** przyciski i zakładki w kształcie pastylek z miękkim cieniem; karty z dużym
  zaokrągleniem i falbanką (chmurkowa krawędź) między ilustracją a treścią; chmurki i gwiazdki
  w tle nagłówka, panelu „Zaskocz mnie” i ilustracji; wyszukiwarka jako zaokrąglone pole;
  kropkowane linie podziału. Ruch: karta unosi się po najechaniu, przycisk „wciska się”, chmurki
  w ilustracji lekko unoszą się (tylko bez ustawienia „mniej ruchu”).

## B. Bajkowa książeczka

- **Nastrój:** ilustrowana książeczka z dzieciństwa — kremowy papier w kropki, kontury jak
  rysowane piórkiem, girlanda chorągiewek pod nagłówkiem, wstążka z napisem, ozdobny inicjał.
  Najbardziej charakterystyczny i „ręcznie robiony”.
- **Paleta:** tekst i kontury `#3a2a1d` (sepia), papier `#fbf3e1`, kolor główny `#9a3824` (ceglana
  czerwień okładki), akcent `#2c5875` (atramentowy błękit — nadtytuły i fokus), musztardowy
  `#e3b341` i oliwkowy tylko w dekoracjach.
- **Typografia:** nagłówki szeryfowe w stylu książkowym (`Iowan Old Style`, `Palatino Linotype`,
  Palatino, Book Antiqua, zapasowo Georgia), kursywa w podpisach i stopce, odręczny krój
  systemowy (`Segoe Print` / `Bradley Hand`) w podpisie ilustracji; tekst interfejsu bez zmian.
- **Co się zmienia:** nieregularne, „szkicowe” zaokrąglenia przycisków i kart; obrys 2 px w kolorze
  tuszu; twardy, ale jasny cień przesunięty jak w druku; owalna ramka ilustracji z gwiazdkami;
  panel „Zaskocz mnie” z przeszyciem (przerywana ramka wewnątrz); falista kreska pod linkami.
  Ruch: przycisk lekko się przechyla po najechaniu i „wciska” po naciśnięciu, karta przechyla się
  o pół stopnia, gwiazdki delikatnie migoczą.

## C. Bajkowy ogród

- **Nastrój:** spokojny ogród w słońcu — miękkie zielenie, ciepła terakota, kwiatki, listki i
  pagórki. Najbliższy obecnej, zielonej tożsamości aplikacji, ale cieplejszy i bardziej baśniowy.
- **Paleta:** tekst `#1f3a2b`, tło `#f4f8ee` (jasna mięta) z delikatnym wzorem listków, kolor główny
  `#2e6842` (liściasta zieleń), akcent `#9e4520` (terakota), obrysy kontrolek `#6b8a74`, fokus
  `#b4531f`, słoneczny `#f6cf63` i kwiatowy róż tylko w dekoracjach i liczniku koszyka.
- **Typografia:** nagłówki szeryfowe o ciepłym rysunku (`Charter`, `Sitka Text`, Cambria, zapasowo
  Georgia), tekst `Avenir Next` / Segoe UI / systemowy.
- **Co się zmienia:** karty i panele w kształcie liścia (dwa rogi mocno zaokrąglone); ilustracja
  jako łąka ze słońcem, chmurką i kwiatkami; pnącze z kropek i listków pod nagłówkiem; listek przy
  wybranej kategorii/kuchni; słoneczny licznik koszyka. Ruch: karta unosi się, serduszko lekko się
  przechyla, łąka w ilustracji powoli faluje.

## Kontrast (WCAG 2.x, liczony skryptem)

Obliczony wzorem luminancji względnej WCAG dla głównych par kolorów, także na najciemniejszym
miejscu gradientów tła. Próg 4,5:1 dla tekstu, 3:1 dla obrysów kontrolek, ikon i fokusu.
Dla porównania dodano obecny wygląd: jego obrys pól (`#c9cebf`) ma tylko 1,59:1 — wszystkie trzy
warianty to poprawiają.


**bajkowa-pastel**

| Para | Kolory | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| tekst --ink #33284f / tło --paper | #33284f / #fdf8fc | 12.85:1 | 4.5:1 | PASS |
| tekst / najciemniejsze tło gradientu | #33284f / #efe6fb | 11.16:1 | 4.5:1 | PASS |
| tekst / karta --white | #33284f / #fffdfe | 13.31:1 | 4.5:1 | PASS |
| pomocniczy --muted / tło | #62577a / #fdf8fc | 6.32:1 | 4.5:1 | PASS |
| pomocniczy / gradient góra | #62577a / #efe6fb | 5.49:1 | 4.5:1 | PASS |
| pomocniczy / panel inspiracji (#f4edfd) | #62577a / #f4edfd | 5.81:1 | 4.5:1 | PASS |
| nadtytuł --orange / tło | #a3325c / #fdf8fc | 6.32:1 | 4.5:1 | PASS |
| nadtytuł / gradient góra | #a3325c / #efe6fb | 5.49:1 | 4.5:1 | PASS |
| biały / przycisk --green | #ffffff / #5b3f9e | 7.93:1 | 4.5:1 | PASS |
| biały / przycisk hover | #ffffff / #4a3189 | 10.04:1 | 4.5:1 | PASS |
| tekst / dymek i komunikat (#fff2c7) | #33284f / #fff2c7 | 12.06:1 | 4.5:1 | PASS |
| tekst / --t-lilac (alergeny, licznik) | #33284f / #eee4fb | 11.00:1 | 4.5:1 | PASS |
| licznik koszyka #7d2148 / #fde2ec | #7d2148 / #fde2ec | 7.91:1 | 4.5:1 | PASS |
| obrys kontrolek / karta | #8d7bb3 / #fffdfe | 3.69:1 | 3:1 | PASS |
| obrys kontrolek / tło gradientu | #8d7bb3 / #efe6fb | 3.09:1 | 3:1 | PASS |
| fokus / tło | #c0306f / #fdf8fc | 5.14:1 | 3:1 | PASS |
| fokus / gradient góra | #c0306f / #efe6fb | 4.46:1 | 3:1 | PASS |
| ulubione aktywne / biały | #c0306f / #fffdfe | 5.32:1 | 3:1 | PASS |
| ulubione nieaktywne / biały | #62577a / #fffdfe | 6.55:1 | 3:1 | PASS |

**bajkowa-ksiazeczka**

| Para | Kolory | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| tekst --ink / papier | #3a2a1d / #fbf3e1 | 12.43:1 | 4.5:1 | PASS |
| tekst / karta | #3a2a1d / #fffaf0 | 13.20:1 | 4.5:1 | PASS |
| pomocniczy / papier | #65513f / #fbf3e1 | 6.78:1 | 4.5:1 | PASS |
| pomocniczy / karta | #65513f / #fffaf0 | 7.20:1 | 4.5:1 | PASS |
| nadtytuł niebieski --orange / papier | #2c5875 / #fbf3e1 | 6.89:1 | 4.5:1 | PASS |
| nadtytuł / karta | #2c5875 / #fffaf0 | 7.31:1 | 4.5:1 | PASS |
| inicjał i strzałki --green / papier | #9a3824 / #fbf3e1 | 6.41:1 | 4.5:1 | PASS |
| biały / przycisk --green | #ffffff / #9a3824 | 7.08:1 | 4.5:1 | PASS |
| biały / hover | #ffffff / #7f2b1a | 9.28:1 | 4.5:1 | PASS |
| wstążka: biały / --green | #ffffff / #9a3824 | 7.08:1 | 4.5:1 | PASS |
| tekst / komunikat (#f6e6bd) | #3a2a1d / #f6e6bd | 11.10:1 | 4.5:1 | PASS |
| krem / toast (ink) | #fffaf0 / #3a2a1d | 13.20:1 | 4.5:1 | PASS |
| obrys kontrolek (ink) / karta | #3a2a1d / #fffaf0 | 13.20:1 | 3:1 | PASS |
| obrys / papier | #3a2a1d / #fbf3e1 | 12.43:1 | 3:1 | PASS |
| fokus / papier | #2c5875 / #fbf3e1 | 6.89:1 | 3:1 | PASS |
| ulubione aktywne / karta | #9a3824 / #fffaf0 | 6.81:1 | 3:1 | PASS |

**bajkowa-ogrod**

| Para | Kolory | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| tekst --ink / tło | #1f3a2b / #f4f8ee | 11.49:1 | 4.5:1 | PASS |
| tekst / gradient góra | #1f3a2b / #e7f2df | 10.70:1 | 4.5:1 | PASS |
| tekst / karta | #1f3a2b / #fffefa | 12.25:1 | 4.5:1 | PASS |
| pomocniczy / tło | #4c6354 / #f4f8ee | 6.06:1 | 4.5:1 | PASS |
| pomocniczy / gradient góra | #4c6354 / #e7f2df | 5.64:1 | 4.5:1 | PASS |
| pomocniczy / panel (#fff7e2) | #4c6354 / #fff7e2 | 6.10:1 | 4.5:1 | PASS |
| nadtytuł terakota / tło | #9e4520 / #f4f8ee | 5.87:1 | 4.5:1 | PASS |
| nadtytuł / gradient góra | #9e4520 / #e7f2df | 5.46:1 | 4.5:1 | PASS |
| nadtytuł / panel | #9e4520 / #fff7e2 | 5.91:1 | 4.5:1 | PASS |
| biały / przycisk --green | #ffffff / #2e6842 | 6.61:1 | 4.5:1 | PASS |
| biały / hover | #ffffff / #24563a | 8.51:1 | 4.5:1 | PASS |
| tekst / komunikat (#fff5d9) | #1f3a2b / #fff5d9 | 11.37:1 | 4.5:1 | PASS |
| tekst / licznik koszyka (słońce) | #1f3a2b / #f6cf63 | 8.26:1 | 4.5:1 | PASS |
| tekst / --t-moss | #1f3a2b / #dcebd0 | 9.91:1 | 4.5:1 | PASS |
| obrys kontrolek / karta | #6b8a74 / #fffefa | 3.77:1 | 3:1 | PASS |
| obrys kontrolek / gradient góra | #6b8a74 / #e7f2df | 3.29:1 | 3:1 | PASS |
| fokus / tło | #b4531f / #f4f8ee | 4.65:1 | 3:1 | PASS |
| fokus / gradient góra | #b4531f / #e7f2df | 4.33:1 | 3:1 | PASS |
| ulubione aktywne / biały | #b03a4f / #fffefa | 5.84:1 | 3:1 | PASS |
| ulubione nieaktywne / biały | #4c6354 / #fffefa | 6.46:1 | 3:1 | PASS |

**obecny (styles.css)**

| Para | Kolory | Kontrast | Próg | Wynik |
|---|---|---|---|---|
| tekst | #263d32 / #faf8f2 | 11.01:1 | 4.5:1 | PASS |
| pomocniczy | #687367 / #faf8f2 | 4.67:1 | 4.5:1 | PASS |
| nadtytuł | #b44f2c / #faf8f2 | 4.83:1 | 4.5:1 | PASS |
| biały / zielony | #ffffff / #234d3c | 9.55:1 | 4.5:1 | PASS |
| obrys pól #c9cebf / biały | #c9cebf / #fffefb | 1.59:1 | 3:1 | FAIL |
| fokus #cc782d / tło | #cc782d / #faf8f2 | 3.14:1 | 3:1 | PASS |


## Dostępność i układ (sprawdzone w headless Chrome)

- Brak przewijania poziomego przy 320, 360, 390 i 1280 px na ekranach: Przepisy, Przepisy z
  rozwiniętymi wykluczeniami, Lista zakupów (z pozycjami), Promocje, okno przepisu, puste Ulubione.
- Wszystkie widoczne kontrolki mają co najmniej 44×44 px (pole wyboru liczone z etykietą; tytuł
  karty jest pominięty, bo klikalna jest cała karta).
- Fokus z klawiatury: obrys 3 px w kolorze fokusu wariantu, z odstępem 3 px — widoczny na tle i
  obok wypełnionych przycisków.
- `prefers-reduced-motion: reduce`: wszystkie przejścia i animacje wariantów są zdefiniowane tylko
  w `@media (prefers-reduced-motion: no-preference)`, a blok `reduce` dodatkowo zeruje animację i
  przesunięcia; działa też istniejąca reguła z `styles.css`.

## Jak podłączyć wybrany wariant

Najprościej (warstwa w osobnym pliku):

1. Skopiować wybrany plik do `apps/web/src/` jako **pojedynczy plik** w katalogu głównym, np.
   `apps/web/src/theme.css`. Uwaga: **nie** jako podkatalog `src/themes/` — obecny
   `scripts/build.mjs` czyta każdy wpis w `dist/` jako plik (błąd `EISDIR` przy katalogu), a test
   powłoki wymaga, by każdy wpis `src/` był w `ASSETS`.
2. W `index.html` dodać zaraz po `<link rel="stylesheet" href="./styles.css">`:
   `<link rel="stylesheet" href="./theme.css">`.
3. W `sw.js` dopisać `'./theme.css'` do tablicy `ASSETS` (inaczej wariant nie zadziała offline, a
   test „Każdy plik powłoki jest w pamięci offline” nie przejdzie).
4. Zmienić `<meta name="theme-color">` na kolor główny wariantu (`#5b3f9e`, `#9a3824` albo
   `#2e6842`) i ewentualnie `theme_color` w `manifest.webmanifest`.
5. W `apps/web/tests/themes.test.mjs` przestawić ścieżkę na nowy plik (lub zostawić warianty w
   `docs/` jako wzorce).

Alternatywnie można wkleić zawartość wariantu na koniec `styles.css` (jedno żądanie mniej, bez
zmian w `index.html` i `sw.js`), ale wtedy trudniej wrócić do poprzedniego wyglądu.

## Jak obejrzeć wariant lokalnie

```sh
npm run build
mkdir -p /tmp/podglad && cp -r apps/web/dist /tmp/podglad/dist && mkdir -p /tmp/podglad/dist/themes
cp docs/design/cnt-031/themes/bajkowa-ogrod.css /tmp/podglad/dist/themes/
sed -i 's#href="./styles.css">#&<link rel="stylesheet" href="./themes/bajkowa-ogrod.css">#' /tmp/podglad/dist/index.html
cd /tmp/podglad && PORT=8090 node <repo>/apps/web/scripts/serve.mjs --dist
```
