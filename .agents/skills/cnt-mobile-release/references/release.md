# Runbook Android/iOS i aktualizacji

## Bieżące repo co na talerzu
Aktywne MVP jest w apps/web i ma konfigurację Capacitor, bez Expo/EAS.
Najpierw przeczytaj apps/web/PLAN-WYDANIA.md i sprawdź capacitor.config.json.
Komendy EAS oraz OTA poniżej dotyczą wyłącznie projektu, który rzeczywiście używa
Expo. Nie generuj eas.json ani nowej aplikacji w trakcie samej konsolidacji repo.
Build web nie stanowi artefaktu AAB/IPA; projekty natywne i testy nadal wymagają wykonania.

## Rozróżniaj etapy
Build tworzy binarium; dystrybucja testowa udostępnia testerom; submission wysyła do platformy/review; akceptacja to decyzja sklepu; rollout udostępnia użytkownikom. Zapisuj stan każdej platformy osobno. Androidowy AAB do Play nie jest APK instalacyjnym. IPA wymaga odpowiedniego podpisania i kanału. Lokalny natywny build iOS wymaga macOS/Xcode; z Windows użyj upoważnionego builda chmurowego lub runnera macOS.

## Konfiguracja i polecenia
Sprawdź app.json/app.config.*, eas.json, runtimeVersion, kanały/branches i istniejący workflow CI. Sekrety w zatwierdzonych magazynach EAS/CI; `EXPO_PUBLIC_*` i cała zawartość klienta są czytelne. Klucze Apple/App Store Connect, Android keystore i service account nie trafiają do repo, raportu ani Drive.

Typowa sekwencja to `eas build --platform android --profile preview` lub `--platform ios`, następnie odczyt stanu joba i `eas submit --platform ... --id KONKRETNY_BUILD_ID` dla upoważnionego submission. To przykłady, nie gotowy skrypt: potwierdź profil i składnię w zainstalowanym CLI i https://docs.expo.dev/eas/cli/. Nie używaj `--latest`, jeśli może wybrać cudzy build. Nie uruchamiaj `--auto-submit` podczas zwykłego przygotowania kandydata. Obecne nazwy usług Expo/EAS i polecenia mogą się zmieniać; sprawdź dokumentację zamiast automatycznej migracji konfiguracji.

Zachowaj powtarzalność: lockfile, toolchain, profil, środowisko, SHA i konfiguracja (bez wartości sekretów). SHA samo nie opisuje niecommitowanych zmian, dynamicznego configu ani remote version; zapisuj resolved identyfikatory i numery. Dla dostępnego pliku oblicz SHA-256; dla wyłącznie zdalnego artefaktu zapisz ID i URL z ograniczonym dostępem, nie wymyślaj hasha.

## Wymagania przed submission — sprawdzaj na dzień wydania
Źródła poniżej zweryfikowano 2026-11-15; checklistę stosuj warunkowo do faktycznych funkcji. Nie zamrażaj numeru target API, wersji Xcode/SDK, progów testowych ani terminów w Skill.

| Obszar | Co ustalić i udokumentować | Źródło |
|---|---|---|
| Apple review | kompletność, funkcjonalność, support/privacy URL, rating, screenshoty z bieżącego UI, konto/demo do review, usuwanie konta w aplikacji jeśli je tworzy | https://developer.apple.com/app-store/review/guidelines/ |
| Apple SDK/privacy | App Privacy odpowiada rzeczywistym przepływom i SDK; wymagane privacy manifests, required-reason APIs i podpisy SDK; ATT tylko jeśli występuje tracking | https://developer.apple.com/support/third-party-SDK-requirements/ i https://developer.apple.com/documentation/bundleresources/privacy-manifest-files |
| Apple auth/płatności | jeśli logowanie zewnętrzne: sprawdź zastosowanie wymogu równoważnej opcji logowania i wyjątków; jeśli sprzedaje cyfrowe funkcje: sprawdź właściwe zasady płatności/regionów | https://developer.apple.com/app-store/review/guidelines/ |
| Google dane | Data safety na podstawie audytu danych i SDK, privacy URL, wymagane disclosure/consent, usuwanie konta w aplikacji i zewnętrzny URL jeśli konto jest tworzone | https://support.google.com/googleplay/android-developer/answer/10144311 |
| Google testy | typ/data utworzenia konta, wymagany tor zamknięty, aktualna liczba testerów i czas oraz dostęp do production; nie zakładaj jednakowych wymagań dla każdego konta | https://support.google.com/googleplay/android-developer/answer/14151465 |
| Google techniczne | aktualny target API, wymagania binarne/urządzeń (w tym strony pamięci 16 KB jeśli dotyczą bibliotek), AAB, Play App Signing, wymagane formularze i app access | https://support.google.com/googleplay/android-developer/answer/18265346 |
| Zdrowie/dzieci | klasyfikacja funkcji żywieniowych/zdrowotnych i właściwe deklaracje; grupa docelowa, ograniczenia reklam/danych; bez twierdzeń medycznych bez odpowiedniej oceny | polityki Apple/Google wskazane powyżej |

Sprawdź również bieżące wymagania SDK/Xcode na https://developer.apple.com/news/upcoming-requirements/ i komunikaty konkretnej aplikacji w konsolach. Checklistę oprzyj na faktycznych SDK i przepływach sieciowych, nie samych deklaracjach autora. Niezgodność formularza i implementacji blokuje submission. Uprawnienia kamery/lokalizacji/powiadomień muszą mieć uzasadnienie, teksty natywne i działającą ścieżkę odmowy.

## Smoke i rollout
Czysta instalacja oraz aktualizacja ze wspieranej wersji; uruchomienie bez Metro, login/logout/deletion, deep links, offline, alergeny, oferta i lista zakupów; brak endpointu dev w prod. Sprawdź podpisaną wersję na obu platformach. Konto testowe i backend review mają działać przez okres oceny.

W upoważnionym rollout użyj etapowania, jeśli platforma i sytuacja je wspierają. Ustal właściciela monitorowania, czas obserwacji, crash-free/ANR i błędy krytycznej ścieżki, progi zatrzymania. Nie twórz samodzielnie stałego monitoringu ani automatyzacji. W razie defektu zatrzymaj rozszerzanie upoważnionego rollout i eskaluj; poprzedniego binarium zwykle nie da się po prostu obniżyć — hotfix wymaga wyższego numeru i właściwego procesu sklepu.

OTA tylko dla kompatybilnego natywnego runtime i w granicach polityk sklepów. Nie dostarczaj zmian natywnych/SDK/uprawnień ani nie omijaj review. Sprawdź runtimeVersion, kanał, środowisko i zgodność backendu; przetestuj aktualizację i ścieżkę recovery/rollback na staging. Rollback JS nie cofa migracji bazy ani kluczy. Manifest: app/version/platform, commit, build ID, resolved runtime, kanał, profil, wynik QA, hash/URL, numer submission, status, autor decyzji, plan wycofania.
