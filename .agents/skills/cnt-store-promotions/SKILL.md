---
name: cnt-store-promotions
description: Pozyskuj, normalizuj i sprawdzaj oferty sklepowe dla co na talerzu,
  uwzględniając ważność, region, opakowania i warunki rabatów. Używaj do danych promocji
  i wyceny koszyka; nie do nieupoważnionego scrapingu lub gwarantowania dostępności.
---

# CNT · Promocje sklepowe

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Obsługa ofert
1. Ustal rynek, sklepy, lokalizację w minimalnym potrzebnym zakresie, datę koszyka oraz źródła. Odczytaj adaptery i model ofert w repo. Czytaj [references/offers.md](references/offers.md) przed importem lub porównaniem cen.
2. Preferuj licencjonowane API/feed, oficjalne strony i materiały dozwolone do użycia. Sprawdź regulamin/licencję, limity i możliwość przechowywania. Sam publiczny URL nie oznacza prawa do masowego kopiowania. Nie obchodź logowania, CAPTCHA ani ograniczeń. Przy braku dostępu użyj dostarczonej legalnej próbki lub przygotuj adapter bez fikcyjnych ofert.
3. Zachowaj pochodzenie i warunki każdej ceny. OCR traktuj jako ekstrakcję do weryfikacji; sprawdź przecinek dziesiętny, gramaturę, zakres dat i przypisy. Nie oznaczaj niepotwierdzonego odczytu jako aktualnej promocji.
4. Normalizuj produkt, wariant, opakowanie i cenę jednostkową. Uwzględnij wielosztuki, kartę/aplikację, kupony, limity i kaucję. Oferty wygasłe usuń z aktywnych rekomendacji; awaria źródła nie przedłuża ich ważności.
5. Wycena musi pokazać założenia i brakujące ceny. Rabat nigdy nie omija filtrów alergii ani wymagań produktu. Zmiany adaptera/reguł obejmij testami i przygotuj PR/raport według references/operations.md.

## Wynik
Znormalizowane rekordy z pochodzeniem, błędy i odrzucone oferty, porównanie kosztów i testy adaptera. Ceny i dostępność opisuj jako stan źródła w danym czasie; nie obiecuj ceny przy kasie ani kompletnego pokrycia rynku.
