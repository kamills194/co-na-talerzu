# UX, dostępność i lokalizacja

## Stany krytyczne
Brak bezpiecznego dopasowania: pokaż powód i możliwość zmiany filtrów, bez automatycznego zdejmowania alergii. Nieznany alergen: widoczna niepewność; badge „zdrowe” nie zastępuje informacji. Brak aktualnej ceny: „Brak potwierdzonej ceny”, nie 0 zł. Offline: oznacz dane z cache i moment pobrania; lista zakupów nadal działa w zakresie wspieranym przez produkt. Usunięcie konta: odróżnij wylogowanie od usunięcia i pokaż skutki/wyjątki retencji.

## Dostępność mobilna
Nadaj role, etykiety i stany kontrolkom; ikonowy przycisk ma nazwę działania. VoiceOver/TalkBack: logiczna kolejność, focus po modalu/błędzie/nawigacji, komunikaty walidacji i zmiany stanu. Nie polegaj wyłącznie na kolorze. Sprawdź duży font bez ucinania kluczowych warunków rabatu, kontrast, dark mode i zmniejszone animacje. Jako cele projektowe przyjmij pola dotyku co najmniej 44 pt iOS / 48 dp Android oraz kontrast WCAG AA (4,5:1 zwykły tekst, 3:1 duży); weryfikuj aktualne wytyczne platformy i kontekst. To cele projektu, nie deklaracja certyfikacji prawnej.

Testuj mały ekran, safe area, klawiaturę, orientację wspieraną przez aplikację oraz hardware back na Android. Nie blokuj powiększania fontów jako sposobu naprawy layoutu. Zgody na lokalizację/kamerę pytaj przy użyciu funkcji; dodaj ręczny wybór sklepu po odmowie lokalizacji.

## pl-PL i kolejne locale
Język startowy pl-PL; architektura gotowa na en bez obowiązku natychmiastowego tłumaczenia wszystkiego. Polski plural dla porcji: 1 porcja, 2 porcje, 5 porcji, 12 porcji, 22 porcje; użyj mechanizmu plural biblioteki, testuj też 0 i ułamki. Intl.NumberFormat formatuje 12,50 zł; nie zamieniaj kropki przecinkiem w danych. Nie sklejaj fragmentów zdań i liczebników. Daty oferty formatuj w strefie rynku, a nie przypadkowej strefie urządzenia.

Każdy klucz ma kontekst, parametry i formy plural zgodne z konfiguracją biblioteki; brak klucza ma kontrolowany fallback. Testuj interpolację, brakujące klucze, długi tekst/pseudolokalizację i nazwy składników. Nie dodawaj RTL bez potrzeby rynku, lecz nie utrudniaj późniejszego wsparcia przez sztywne left/right. Źródła: https://reactnative.dev/docs/accessibility, https://www.w3.org/WAI/standards-guidelines/wcag/, https://www.i18next.com/translation-function/plurals — sprawdzaj dla używanej wersji.
