# Kontrakt oferty i wyceny

## Minimalny rekord
ID źródła i oferty; URL/licencja; fetchedAt/verifiedAt; sklep i zakres placówek/region; identyfikator produktu/EAN jeśli znany; nazwa/marka/wariant; ilość netto i jednostka; cena brutto w groszach i waluta; validFrom/validTo wraz ze strefą i semantyką granic; typ rabatu; karta/kupon; minimalna ilość; limit/osoba; kaucja; źródło i status dostępności; poziom pewności ekstrakcji. Nie wymyślaj EAN ani ceny przekreślonej.

Nie utożsamiaj ceny regularnej, historycznej i najniższej ceny z wymaganego okresu. Jeśli UI eksponuje obniżkę/porównanie historyczne, ustal z właścicielem produktu wymagane ujawnienia dla rynku na podstawie aktualnych wytycznych UOKiK https://uokik.gov.pl/ i danych źródłowych; brak danych blokuje twierdzenie o procentowej oszczędności, nie pokazanie zweryfikowanej ceny bieżącej.

## Przeliczenia
Porównuj PLN/kg, PLN/l lub PLN/szt tylko w tej samej kategorii i wariancie. Cena „2 za 10 zł” daje 5 zł/szt tylko przy spełnieniu warunku; przy jednej sztuce nie zgaduj ceny. „Drugi -50%” nie jest -50% całego koszyka. Nie łącz kuponów, jeśli źródło nie pozwala. Koszt zakupu dla potrzebnej ilości q i opakowania p to liczba opakowań zaokrąglona w górę, z osobnym rozliczeniem rabatów progowych. Ujawnij nadwyżkę i osobno koszt zużytej części. Kaucję i wymagane opłaty pokaż jawnie.

Nie deklaruj „najtańszy koszyk”, gdy brakuje cen, sklepów, dostępności lub nie uwzględniono warunków. Użyj „najniższy koszt wśród zweryfikowanych ofert” z zakresem porównania. Transport/czas zakupu uwzględniaj tylko przy dostępnych danych i wymaganiu użytkownika.

## Testy adaptera
Próbki syntetyczne: 0,99 zł i 1 299,00 zł; opakowanie 400 g vs 1 kg; „od” zamiast ceny końcowej; karta obowiązkowa; wielosztuka niespełniona; oferta tylko regionalna; koniec ważności o lokalnej północy; zmiana czasu; cena OCR 199 zamiast 1,99; brak kaucji; dwa źródła tej samej oferty. Błąd parsera kieruj do kwarantanny danych. Zachowuj ostatnie poprawne dane tylko jako jawnie oznaczony cache z ważnością źródłową.

Retry adaptera ma backoff i limit; 429 respektuje Retry-After. Nie traktuj HTML z błędem jako pustej listy aktualnych ofert. Deduplikuj po źródle/ID/wariancie/okresie, nie tylko nazwie.
