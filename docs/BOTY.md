# Boty Co na talerz

| Proces | Uruchomienie | Działanie |
| --- | --- | --- |
| Kucharz | Formularz wyszukiwania w domenie produkcyjnej | Najpierw przeszukuje katalog. Gdy brak wyniku, endpoint PHP sprawdza na żywo licencjonowany Open Recipe Corpus i zapisuje dopasowany przepis z oryginalnym źródłem. Bez modelu i klucza API. |
| Analityk strony | GitHub Actions co 30 minut i po wdrożeniu | Sprawdza przekierowania, certyfikat, opublikowane pliki i świeżość wdrożenia. Pobiera zgłoszenia przez SFTP, grupuje powtarzalne awarie i zgłasza je na GitHubie. Dane z kolejki usuwa po zakończonym przebiegu. Bez modelu. |
| Oferty sklepów | GitHub Actions co 6 godzin | Aktualizuje raz dane używane przez domenę produkcyjną i GitHub Pages. Bez osobnego, dublującego przebiegu ALDI. |

Kucharz korzysta z pamięci pozytywnych i nieudanych wyszukiwań. Jedno zapytanie może dotrzeć do dostawcy najwyżej raz w tym samym czasie. Limity wynoszą 12 nowych zapytań na przeglądany adres dziennie i 120 dla witryny. Czasowy identyfikator limitu jest haszowany z losową solą. Gotowe przepisy są publiczne i przechodzą weryfikację formatu, języka i zgodności tytułu z hasłem. Kucharz zwraca brak wyniku, gdy dostępne źródło nie ma dania. Treści z importu i z wyszukiwarki mają przypisanie autorstwa i ostrzeżenie o możliwej niekompletności alergenów. Rozszerzenie obsługuje polski i angielski.

Wdrożenie wymaga PHP 8.1+ z rozszerzeniami cURL i mbstring, zapisu w katalogu domeny oraz połączenia HTTPS z `recipes.airon.app`. Katalog `_chef` jest blokowany przez Apache i zachowywany przy kolejnych wdrożeniach. Skompilowane statyczne kopie, np. GitHub Pages, pokazują katalog z repozytorium.

Przepisy bazowe pochodzą z [Open Recipe Corpus](https://github.com/Rippy1911/open-recipe-corpus/tree/86102603bac07d79b94bc35cba5b50346798cc09). Dane źródłowe zachowują [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), przypisanie i historię edycji. Kod aplikacji jest osobnym utworem. Import wybrał 430 różnych pozycji po polsku, w tym 358 z angielskim tłumaczeniem automatycznym. Pozostałe języki zachowują dotychczasowy przetłumaczony katalog.

Kolejka techniczna używa istniejących sekretów SFTP. Narzędzia `scripts/bots/monitor.mjs` i `scripts/bots/collect-errors.mjs` można uruchomić bez zapisu, ustawiając `DRY_RUN=1`. Poprzednie harmonogramy kucharza, redaktora, monitora, zbierania błędów i duplikatu ALDI zostały wycofane z Actions.
