# Hosting conatalerz.pl na nazwa.pl

Aplikacja jest statyczną PWA (`apps/web/dist`), wszystkie ścieżki są względne,
więc działa w katalogu głównym domeny bez zmian w kodzie. Nie potrzebuje PHP ani bazy.

Wdrożenie wykonuje `.github/workflows/deploy-nazwa.yml` po każdym scaleniu do `main`
(lub ręcznie: Actions → *Deploy conatalerz.pl (nazwa.pl)* → Run workflow):
testy → build → dodanie `deploy/nazwa.pl/.htaccess` → wysyłka FTPS → sprawdzenie HTTP 200.
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
| Variable (opcja) | `NAZWA_FTP_PROTOCOL` | `ftps` (domyślnie) albo `ftp`, gdy FTPS nie działa |

Potem Actions → *Deploy conatalerz.pl (nazwa.pl)* → **Run workflow**.

## 3. Po pierwszym wdrożeniu

- Otwórz https://conatalerz.pl — powinno być przekierowanie z `http://` i `www.`.
- Akcja zapisuje na serwerze `.ftp-deploy-sync-state.json`; kolejne wdrożenia wysyłają
  tylko zmienione pliki. Nie usuwaj go (inaczej następna wysyłka obejmie wszystko).
- GitHub Pages (`pages.yml`) nadal działa równolegle. Gdy conatalerz.pl jest sprawdzone,
  można go wyłączyć (Settings → Pages → None) i usunąć `pages.yml`.
- Oferty (`offers.json`) trafiają na serwer przy każdym wdrożeniu — po uruchomieniu bota
  ofert zatwierdź zmieniony plik w repo, żeby pojawił się na stronie.

## Rozwiązywanie problemów

- **530 / Login incorrect** — zły login/hasło lub konto FTP zablokowane w panelu.
- **Timeout / TLS** — ustaw `NAZWA_FTP_PROTOCOL=ftp` i sprawdź ponownie.
- **Strona domyślna nazwa.pl zamiast aplikacji** — zły `NAZWA_FTP_DIR` albo pozostawiony `index.php`.
- **500 Internal Server Error** — serwer nie akceptuje dyrektywy w `.htaccess`; usuń problematyczny blok
  w `deploy/nazwa.pl/.htaccess`.
