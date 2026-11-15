# Decyzje implementacyjne i sprawdzenia

## Krytyczne kontrakty
Przepis: ID, wersja, nazwa/locale, liczba porcji > 0, składniki z ilością/jednostką, stan surowy/ugotowany, kroki, alergeny znane i nieustalone, źródła. Oferta: ID źródła, produkt/wariant/EAN gdy znany, opakowanie, cena w groszach, waluta, zakres sklepu, warunki i okres. Nie używaj nazwy produktu jako unikalnego identyfikatora.

Przeliczaj ilości z precyzją dziedzinową; zaokrąglaj do prezentacji lub jawnej reguły zakupu opakowań. Przy braku gęstości nie konwertuj ml na g. Koszyk grupuj według produktu i kompatybilnej jednostki, uwzględniając zapasy osobno. Kwoty API waliduj jako skończone i nieujemne.

## Zmiany danych
Izoluj dev/staging/prod. Supabase testuj jako anon i user A/B; pozytywny odczyt własnego rekordu i odmowa odczytu/zapisu cudzego. To samo dla plików i funkcji serwerowych. Uprawnienie UI nie jest kontrolą bezpieczeństwa. Plan usunięcia konta obejmuje powiązane rekordy, storage, cache i określone wyjątki retencji; nie kasuj historii audytu bez decyzji właściciela danych.

Lista offline ma stabilne ID i idempotentne operacje. Ustal rozwiązywanie konfliktów, retry z limitem i ponowne logowanie po wygaśnięciu sesji. Nie powielaj pozycji po reconnect. Daty promocji testuj na granicy dnia i zmiany czasu Europe/Warsaw.

## Weryfikacja
Odczytaj scripts z package.json; uruchamiaj ich rzeczywiste nazwy. Typowe odpowiedniki to `tsc --noEmit`, ESLint, Jest oraz scenariusze Maestro. Przed dodaniem zależności sprawdź kompatybilność SDK, licencję i wpływ na prywatność. Celowane testy: skalowanie porcji, jednostki, grosze i opakowania, wykluczenie alergenu, nieznany produkt, brak sieci, odmowa autoryzacji. Test regresji ma wykrywać błąd, nie kopiować implementację.

Natywna biblioteka/config plugin/uprawnienie wymaga development build lub nowego binarnego kandydata; Expo Go i OTA nie są dowodem zgodności. Nie publikuj Update przy zmianie natywnego runtime. Odczytaj aktualną dokumentację Expo i istniejące runtimeVersion/channels.
