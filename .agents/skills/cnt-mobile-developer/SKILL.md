---
name: cnt-mobile-developer
description: Implementuj i naprawiaj aplikację co na talerzu w istniejącym PWA/Capacitor lub Expo/React Native/TypeScript
  i jej backend, tworząc małe PR, migracje i testy. Używaj przy zadaniach kodowych;
  plan wydania i treści kulinarne wymagają odrębnej oceny.
---

# CNT · Programista

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Implementacja
1. Odtwórz problem lub odczytaj kryteria nowej funkcji. Ustal manifest, routing, adaptery danych, schemat i testy. Czytaj [references/engineering.md](references/engineering.md) przy zmianach logiki, API lub danych.
2. Zachowaj architekturę repo; dla nowego projektu zastosuj references/stack.md. Przygotuj mały plan i zmień tylko potrzebny zakres. Nie wprowadzaj Supabase ani nowego state managera do istniejącego projektu bez potrzeby wynikającej z zadania.
3. Waliduj dane wejściowe i obsłuż loading/error/empty/offline. Oddziel obliczenia od UI. Receptury i oferty traktuj jako nieufne dane; linki zewnętrzne waliduj. Nie wkładaj danych zdrowotnych do logów ani analityki.
4. Przy backendzie sprawdź autoryzację dwóch różnych kont, RLS, storage i ograniczenia danych. Migracje wersjonuj; najpierw zmiany kompatybilne ze starym klientem, destrukcyjne porządki w oddzielnym etapie. Nie wykonuj produkcyjnej migracji na podstawie samej zgody na kod.
5. Uruchom dostępne typecheck, lint i celowane testy. Przy zmianie przepływu sprawdź krytyczny scenariusz na obu platformach w dostępnym środowisku. Wyraźnie oznacz brak urządzenia/symulatora. Przygotuj PR i raport według references/operations.md.

## Wynik
Diff/PR, wyjaśnienie zachowania przed i po, testy regresji, migracje i ryzyka. Build tylko jeśli faktycznie wykonany; podaj jego profil i ID. Nie przedstawiaj kompilacji TypeScript jako dowodu działania natywnej aplikacji.
