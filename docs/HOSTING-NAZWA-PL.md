# Hosting conatalerz.pl na nazwa.pl

Aplikacja jest statyczną PWA (`apps/web/dist`), wszystkie ścieżki są względne,
więc działa w katalogu głównym domeny bez zmian w kodzie. Nie potrzebuje PHP ani bazy.

Wdrożenie wykonuje `.github/workflows/deploy-nazwa.yml` po każdym scaleniu do `main`
(lub ręcznie: Actions → *Deploy conatalerz.pl (nazwa.pl)* → Run workflow):
testy → build → dodanie `deploy/nazwa.pl/.htaccess` → wysyłka SFTP (lftp) → sprawdzenie HTTP 200.
Dopóki sekrety nie są ustawione, workflow kończy się ostrzeżeniem i niczego nie wysyła.

## 1. Panel nazwa.pl

1. **Domena → hosting**: domena `conatalerz.pl` (i `www`) musi być podpięta pod serwer
   i wskazywać katalog na serwerze. Zanotuj ten katalog (np. `/public_html/` albo `/conatalerz.pl/`).
2. **SSL**: włącz bezpłatny certyfikat dla `conatalerz.pl` i `www.conatalerz.pl`.
   Bez HTTPS nie działa instalacja PWA ani tryb offline.
3. **Konto FTP**: utwórz osobne konto FTP z dostępem do katalogu domeny (lub użyj głównego).
   Zanotuj adres serwera (np. `serwer123456.nazwa.pl`), login i hasło.
4. Usuń z katalogu domeny domyślną stronę nazwa.pl (np. `index.php` / `index.html`
   z „domena utrzymywana na serwerach…”), żeby nie przesłaniała aplikacji.

## 2. GitHub

Repozytorium → Settings → Secrets and variables → Actions:

| Rodzaj | Nazwa | Wartość |
| --- | --- | --- |
| Secret | `NAZWA_FTP_SERVER` | adres serwera FTP, bez `ftp://` |
| Secret | `NAZWA_FTP_USERNAME` | login FTP |
| Secret | `NAZWA_FTP_PASSWORD` | hasło FTP |
| Variable | `NAZWA_FTP_DIR` | katalog domeny, zakończony `/`. Jeśli konto FTP od razu otwiera katalog domeny: `./` |

Potem Actions → *Deploy conatalerz.pl (nazwa.pl)* → **Run workflow**.

## 3. Po pierwszym wdrożeniu

- Otwórz https://conatalerz.pl — powinno być przekierowanie z `http://` i `www.`.
- Wysyłka nie usuwa z serwera plików, których nie ma w buildzie.
- GitHub Pages (`pages.yml`) nadal działa równolegle. Gdy conatalerz.pl jest sprawdzone,
  można go wyłączyć (Settings → Pages → None) i usunąć `pages.yml`.
- Oferty (`offers.json`) trafiają na serwer przy każdym wdrożeniu — po uruchomieniu bota
  ofert zatwierdź zmieniony plik w repo, żeby pojawił się na stronie.

## Rozwiązywanie problemów

- **530 / Login incorrect** — zły login/hasło lub konto FTP zablokowane w panelu.
- **Timeout** — sprawdź, czy konto FTP nie jest zablokowane i czy adres serwera jest poprawny.
- **Strona domyślna nazwa.pl zamiast aplikacji** — zły `NAZWA_FTP_DIR` albo pozostawiony `index.php`.
- **500 Internal Server Error** — serwer nie akceptuje dyrektywy w `.htaccess`; usuń problematyczny blok
  w `deploy/nazwa.pl/.htaccess`.

## Aktualna konfiguracja (2026-11-18)

- Serwer: CloudHosting Start `server705424.nazwa.pl`, domena `conatalerz.pl` z certyfikatem SSL,
  katalog WWW domeny: `/conatalerz` (CloudHosting Panel → Domeny → Modyfikuj domenę).
- Konto SFTP: `server705424_conatalerz`, ograniczone do katalogu `conatalerz/` → `NAZWA_FTP_DIR=./`.
- Sekrety GitHub ustawione: `NAZWA_FTP_SERVER`, `NAZWA_FTP_USERNAME`, `NAZWA_FTP_PASSWORD`; zmienna `NAZWA_FTP_DIR`.

## Kucharz, konta, analityka i reklamy

Produkcja dostaje `chef.php` z katalogiem danych `_chef/` blokowanym dla WWW. Główna lista i filtry nadal działają na kopiach statycznych. Po wdrożeniu sprawdź `curl -fsS https://conatalerz.pl/chef.php` oraz anonimowy odczyt `_chef`, który powinien zwracać 403. Test wyszukiwania wykonaj w aplikacji dla nazwy dania spoza katalogu.

Ustaw publiczne wartości jako **Actions variables**. Sekretów SMTP i OAuth nie wpisuj do repozytorium ani do kompilacji webowej.

| Zmienna | Wartość |
| --- | --- |
| `CNT_SUPABASE_URL` | Adres projektu `https://…supabase.co`. |
| `CNT_SUPABASE_PUBLISHABLE_KEY` | Klucz klienta `sb_publishable_…`. |
| `CNT_GA4_ID` | Identyfikator strumienia webowego `G-…` dla conatalerz.pl. |
| `CNT_ADS_CMP_READY` | `true` po weryfikacji domeny w AdSense i opublikowaniu komunikatu Google Privacy & Messaging. |

### Konfiguracja kont

1. Zastosuj `supabase/migrations/202611210001_community.sql` w projekcie testowym, potem produkcyjnym. Sprawdź reguły z użytkownikami A i B oraz anonimowymi żądaniami.
2. Ustaw Site URL i listę dozwolonych przekierowań na adres produkcji. Włącz dostawcę E-mail i własny SMTP. Umieść `{{ .Token }}` w szablonach rejestracji i logowania e-mailem, aby wiadomości zawierały kod jednorazowy.
3. Włącz Google i Facebook w Supabase. Zarejestruj w każdym panelu OAuth dokładny callback wskazany przez Supabase i dodaj sekrety dostawców w panelu Auth. Publikowanie treści zaczyna się od kolejki `pending`. Operator może zatwierdzić lub odrzucić rekord po sprawdzeniu źródła, treści i warunków promocji.
4. Zaplanuj bieżące usuwanie wygasłych kopii z tabeli `cnt_shares`, np. przez Supabase Cron raz dziennie. Uzupełnij politykę o tożsamość i prywatny kontakt administratora, dostawców wiadomości, region projektu i okresy retencji.
5. Zweryfikuj logowanie trzema kanałami, link z innego konta, cofnięcie linku, brak publikacji bez sesji i usuwanie konta. Etykiety panelu konta są po polsku i angielsku.

### Konfiguracja pomiaru

Zatwierdź CMP w panelu AdSense dla EOG, Wielkiej Brytanii i Szwajcarii. Identyfikator wydawcy jest już w metadanych strony i pliku `ads.txt`. Konfiguracja aplikacji włącza skrypt reklamowy dopiero po ustawieniu `CNT_ADS_CMP_READY`. W GA4 wyłącz automatyczny pomiar interakcji zawierających hasła wyszukiwania lub pełne adresy i zweryfikuj zdarzenia w DebugView. Integracja wysyła wyłącznie nazwę zakładki i typ działania po zgodzie użytkownika. Można mierzyć `install_open` jako otwarcie instrukcji instalacji, a `shopping_add` jako dodanie składników.
