---
name: cnt-mobile-release
description: Przygotuj i weryfikuj buildy oraz wydania Android/iOS co na talerzu
  przez konfigurację projektu Capacitor lub Expo/EAS i konsole sklepów, z checklistą prywatności, QA i rollout. Używaj
  do pakowania, testowej dystrybucji i upoważnionej publikacji; samo użycie Skill
  nie zezwala na produkcyjny rollout.
---

# CNT · Publikacja Android/iOS

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Przygotowanie i wydanie
1. Ustal cel: lokalny pakiet, build w chmurze, kanał testowy, submission do review czy rollout produkcyjny. Odczytaj istniejące upoważnienie dla konta, aplikacji, platformy i kanału. Nie proś ponownie o upoważnienie już udzielone, ale nie rozszerzaj zgody na build do publikacji.
2. Czytaj [references/release.md](references/release.md) przed budowaniem lub wysłaniem. Potwierdź czysty stan kandydata/SHA, bundle ID/package, konto/team, version/buildNumber/versionCode, profile i środowisko. Nie generuj przypadkowych identyfikatorów ani nie zastępuj istniejących kluczy podpisu.
3. Odczytaj raport QA i required checks dla tego kandydata. Przygotuj metadata, politykę prywatności, deklaracje danych i plan wycofania. Zweryfikuj aktualne wymagania w źródłach oficjalnych; zapisz datę, URL i wynik, a nie stałą obietnicę zgodności.
4. Uruchom build tylko w upoważnionym zakresie; chmurowy build może zużywać płatny limit. Obserwuj job do terminalnego stanu, zapisuj ID i artefakt. Sprawdź instalację podpisanego kandydata, konfigurację backendu i brak testowych sekretów/danych.
5. Wykonaj dozwolony następny etap: testowa dystrybucja, submission albo rollout. Gdy produkcyjny etap nie jest upoważniony, najpierw ukończ wszystko, co da się przygotować i pokazać do oceny, potem wskaż dokładną brakującą decyzję. Po timeout sprawdź stan joba/sklepu przed retry; nie wysyłaj duplikatu wersji.
6. Po dozwolonym wdrożeniu potwierdź status w konsoli, kanał i zasięg. Submission nie oznacza akceptacji ani dostępności publicznej. Raportuj links/IDs i znane blokady według references/operations.md.

## Wynik
Manifest release z SHA/build ID, profilem, numerami wersji, artefaktem/hash, wynikami QA, checklistą sklepów i dokładnym statusem. Jeżeli brak kont/urządzeń/zgody, oddaj gotową konfigurację i pakiet informacji; nie wymyślaj .aab/.ipa ani zatwierdzenia sklepu.
