# Macierz QA i raportowanie

## Warstwy
| Ryzyko | Scenariusz | Warstwa |
|---|---|---|
| Alergen | zamiennik wprowadza orzechy; źródło nieznane | logika + UI |
| Ilości | porcje 2→5, ułamki, g/ml, zero porcji | jednostkowe + walidacja |
| Cena | multipack, karta, kupon, kaucja, brak ceny, koniec oferty | logika + integracja + UI |
| Prywatność | user A nie odczytuje/modyfikuje user B, także storage/RPC | integracyjne |
| Konto | reauth, wygasły token, eksport, usunięcie i lokalny cache | API + urządzenie |
| Lista | offline→online, dwie edycje, ponowny retry, restart | integracyjne + E2E |
| Dostępność | screen reader, font, kontrast, focus i odmowa uprawnienia | urządzenie + przegląd |
| Release | czysta instalacja, upgrade ze wspieranej wersji, deep link | podpisany build |

Wybieraj przypadki dla zmiany i jawnie oznacz resztę jako poza zakresem. Dla wydania sprawdź główną ścieżkę: preferencje → przepis → porcje → lista → oferta → zapis offline/reconnect, oraz konto i uprawnienia jeśli występują. Sprawdź Android i iOS, najstarszy wspierany OS i reprezentatywny aktualny OS według macierzy projektu. Nie deklaruj pełnego pokrycia urządzeń.

## Format przypadku
ID; kryterium; preconditions i dane syntetyczne; kroki; expected; actual; PASS/FAIL/NOT_RUN/BLOCKED; SHA/build ID; urządzenie/OS; czas; dowód. Test automatyczny ma deterministyczne wejścia i nie zależy od bieżącej promocji w sklepie; żywe źródła sprawdzaj osobnym testem kontraktu z datą.

Defekt: krótki tytuł opisujący objaw; kroki; expected/actual; zakres; dowód bez PII; priorytet i wpływ. Krytyczne: ryzyko zdrowotne, wyciek między kontami, utrata danych, niemożliwy start kandydata. Wysokie: blokada głównej ścieżki bez obejścia lub błędna cena zakupu. Drobne: kosmetyka bez zmiany znaczenia. Priorytet nie wynika tylko z liczby screenshotów.

## Bramka rekomendacji
GO: kryteria spełnione, wymagane checks i testy kandydata zaliczone, brak blokujących defektów, znane ograniczenia opisane. CONDITIONAL: ryzyko nieblokujące i konkretne warunki akceptacji właściciela. NO_GO: defekt krytyczny/wysoki w głównej ścieżce lub brak obowiązkowej weryfikacji. Nie oznaczaj GO po samym lint. Nowy SHA/build wymaga oceny wpływu i aktualizacji dowodów; nie przepisuj numeru wersji do starego raportu.
