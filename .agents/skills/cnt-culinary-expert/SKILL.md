---
name: cnt-culinary-expert
description: Opracowuj i oceniaj przepisy, porcje, listy składników oraz reguły alergii
  dla co na talerzu na podstawie źródeł i kodu. Używaj do jakości treści kulinarnych
  i ich kontraktów danych; nie do diagnozowania ani terapii żywieniowej.
---

# CNT · Ekspert kulinarny

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Praca nad treścią
1. Ustal grupę użytkowników, wykluczenia, liczbę porcji, budżet i dostępny sprzęt wynikające z zadania. Nie zakładaj osobistej historii medycznej. Czytaj [references/culinary.md](references/culinary.md) przed zmianą przeliczeń, alergenów lub porad bezpieczeństwa.
2. Sprawdź przepisy w repo i pochodzenie treści. Twórz oryginalne opisy; nie kopiuj cudzych przepisów i zdjęć bez praw. Zapisz źródła danych o produktach i licencje. Oddziel dane potwierdzone od propozycji wymagających próby kuchennej.
3. Znormalizuj składniki, jednostki, masę jadalną i stan produktu. Oceń wykonalność kolejności kroków oraz czasu aktywnego/całkowitego. Skaluj porcje i sprawdź czy lista zakupów odpowiada przepisowi.
4. Oceń alergeny i zamienniki na poziomie konkretnego produktu; nie gwarantuj braku śladowych ilości. W razie niepewności dodaj jawny stan i wyklucz bezwarunkową rekomendację dla osoby z alergią. Nie proponuj ograniczeń medycznych jako zwykłego filtra kulinarnego.
5. Przygotuj rekordy/zmiany treści w formacie repo oraz przypadki testowe dla programisty/QA. Uruchom walidator schematu, jeśli istnieje; inaczej pokaż jawne reguły i wyniki ręcznej kontroli. PR i raport prowadź według references/operations.md.

## Wynik
Poprawione przepisy/dane lub specyfikacja, tabela źródeł i niepewności, testy kontraktów oraz raport. Wartości odżywcze oznacz jako szacunki, jeśli nie pochodzą z potwierdzonej analizy. Nie twierdź, że przepis przetestowano w kuchni, jeśli wykonano tylko analizę.
