# Plan wydania

Stan: lokalne MVP web/PWA. Brak gotowego APK/AAB/IPA, podpisów, testów na fizycznych telefonach i publikacji sklepowej. Nie zgłoszono aplikacji do recenzji. Wskazana wcześniej strona Site pozostaje osobnym wdrożeniem.

## 1. Beta web i jakość treści

Opublikować `dist/` pod HTTPS, przetestować instalację, zamknięcie i ponowne otwarcie offline w Chrome Android i Safari iOS. Sprawdzić urządzenia o szerokości 320–430 px, poziomą orientację, duży tekst, klawiaturę, VoiceOver i TalkBack. Zweryfikować wszystkie receptury w kuchni, proporcje, alergeny i dobór filtrów. Dodać politykę prywatności z danymi rzeczywistego wydawcy i kontakt pomocy. Nie dodawać fikcyjnych kont, logowania ani deklaracji zdrowotnych.

## 2. Kanał danych promocji

Adapter ALDI jest pierwszym działającym odczytem; kolejne sklepy wymagają jawnego źródła z datą i warunkami. Preferować oficjalne feedy/API lub uzgodniony dostęp. Nie wyciągać cen z samych wyników wyszukiwania. Dodać monitoring zmian struktury, pełne warunki ofert, identyfikatory wariantów i jednostek, limity pobierania, strefę Europe/Warsaw, metryki błędów oraz przegląd treści. Uruchomić bota na serwerze z trwałym harmonogramem i publikacją JSON przez HTTPS; aplikacja mobilna powinna pobierać dane z własnego API zamiast odpytywać sklepy. Serwer nie jest jeszcze wdrożony. Przed połączeniem z istniejącym backendem Site dopasować kontrakt oraz autoryzację aktualizatora; nie umieszczać kluczy w aplikacji.

## 3. Opakowanie mobilne Capacitor

Na maszynie z Node i npm zainstalować zgodne, aktualne wersje Capacitor (następnie przypiąć wersje i zachować lockfile):

```sh
npm install @capacitor/core @capacitor/android @capacitor/ios
npm install --save-dev @capacitor/cli
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
```

Polecenia natywne są planem do wykonania, nie częścią obecnie zweryfikowanego buildu. Wybierz docelowy unikalny identyfikator — `pl.conatalerz.app` jest roboczy. Android wymaga Android Studio/SDK i zgodnego JDK; iOS wymaga macOS oraz Xcode. Dokładne wersje zależą od wybranej wersji Capacitor: [oficjalne wymagania](https://capacitorjs.com/docs/getting-started/environment-setup). Nie da się lokalnie skompilować iOS samym Node na Windows.

Przenieść dane do natywnego trwałego magazynu (np. Capacitor Preferences), obsłużyć migracje i udostępnianie listy zakupów przez system. Sprawdzić safe area, przycisk Wstecz Android, modal, klawiaturę, tryb offline, aktualizację katalogu i odzyskiwanie danych. Uzupełnić natywne ikony i ekrany startowe. Przeprowadzić testy na urządzeniach i emulatorach, bez żądania zbędnych uprawnień.

## 4. Testy zamknięte i sklepy

Google Play: konto wydawcy, podpisany AAB, Play App Signing, wymagany docelowy poziom API w dniu zgłoszenia, opis PL, zrzuty ekranu, kategoria wiekowa, Data safety i polityka prywatności. Nowe konta osobiste mają dodatkowe warunki testów przed produkcją — zweryfikować aktualne wymagania konta w [Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=pl). Nie zakładać z góry uzyskania dostępu produkcyjnego.

Apple: konto deweloperskie, App Store Connect, podpisy i profile, archiwum z Xcode, TestFlight, metadane prywatności, wiek, opis i zrzuty. Recenzja ocenia kompletność i minimalną użyteczność; opakowanie strony nie gwarantuje akceptacji. Patrz [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), szczególnie 2.1 oraz 4.2.

## Kryteria gotowości

Wszystkie scenariusze gotowania, ulubionych, zakupów, kopii i odświeżania ofert przechodzą na obu systemach. Żadna wygasła/przyszła oferta nie jest oznaczana jako aktualna. Nie ma mieszania języków ani nieprzetłumaczonych kluczy. Nie tracimy danych po aktualizacji. Polityka prywatności opisuje faktycznie wdrożone funkcje. Wydawca zatwierdza treści, prawa do materiałów, dane kontaktowe i wersje sklepowe. Dopiero wtedy wysyłka do recenzji; decyzję podejmują sklepy.

Wymagania opisano na podstawie oficjalnych dokumentacji odczytanych 15 listopada 2026 r.; należy je ponownie sprawdzić przed wysyłką.
