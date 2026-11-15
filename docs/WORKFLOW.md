# Wspólna wersja projektu co na talerzu

Repozytorium: https://github.com/kamills194/co-na-talerzu — prywatne, gałąź main.
Folder Drive: https://drive.google.com/drive/folders/1PYHtPoRuIvv-wyi2jkawOwudBI7y1XbT.
Wszystkie zadania używają tego repo i identyfikatorów z project.config.json.

GitHub przechowuje kod, siedem Skills, backlog, źródła raportów i konfigurację CI.
Drive przechowuje kopie raportów oraz snapshoty w podfolderach raporty i wersje.
Każdy raport/snapshot Drive wskazuje dokładny SHA commitu i link do repo.
Nie edytuj kodu równolegle w kopii ZIP z Drive.

## Rozpoczęcie pracy

git clone https://github.com/kamills194/co-na-talerzu.git
cd co-na-talerzu
git fetch origin
git switch main
git pull --ff-only
git switch -c cnt-NNN-opis

Jeśli masz niezacommitowane zmiany, najpierw je zachowaj w swojej gałęzi.
Nie wykonuj reset --hard ani force push. Starsze katalogi z poprzednich czatów
są źródłami historycznymi; nowe zadania wykonuj na checkout tego repo.
Przy pracy równoległej użyj osobnych gałęzi/worktree. Każdy wykonawca potrzebuje
dostępu do prywatnego repo i folderu Drive; nie rozszerzaj dostępu publicznie.

## Zadanie → PR → raport

1. Wybierz zadanie CNT z docs/BACKLOG.md. Zapisz zakres i kryteria odbioru.
2. Sprawdź AGENTS.md i odpowiedni Skill w .agents/skills. Zachowaj PWA/Capacitor.
3. Wprowadź zmianę na gałęzi zadania. Testy: node scripts/run.mjs test.
   Build: node scripts/run.mjs build. Przy zmianach UI wykonaj odbiór ręczny.
4. Zapisz raport w reports/CNT-NNN.md: cel, wynik, komendy, ograniczenia,
   SHA kodu i identyfikator zadania. Kod, Skills i raport commituj na tej samej gałęzi.
5. Push i PR do main. CI sprawdza testy/build i zapisuje artefakt web.
   Porównaj testowany SHA z head PR; po zmianie kodu oceń ponowną weryfikację.
6. Po dozwolonym scaleniu PR pobierz main i zapisz dokładny SHA. Prześlij raport
   do folderu raporty na Drive z SHA i linkiem do commitu/PR. ZIP w folderze wersje
   musi mieć manifest SHA-256 i commit SHA. Przy zwykłym zadaniu wystarczy raport.
7. Sprawdź zdalne metadane Drive: folder, rozmiar/hash i URL. Zapisz linki oraz
   SHA źródła w raporcie zadania lub reports/connection-status.json.

## Zapis do Drive

Używaj narzędzi Google Drive upload_file, update_file, get_file_metadata i list_folder
oraz rzeczywistych ID z project.config.json. Przy ponownym zapisie aktualizuj znany
fileId albo utwórz nową wersję z SHA; unikaj duplikatów. Po zapisie wykonaj readback.
Nie zmieniaj uprawnień folderu bez zadania obejmującego konkretnych odbiorców.

Bezobsługowa synchronizacja GitHub Actions → Drive nie jest skonfigurowana.
Nie dodano nieistniejących sekretów Google do CI. Zapis przez konektor jest etapem
kończenia zadania w upoważnionej sesji. Jeśli konektor nie działa, raport pozostaje
w GitHub, a brak kopii Drive ma jawny status.

## Wydania

Build web, AAB/IPA, testowa dystrybucja i publikacja sklepowa to osobne etapy.
Obowiązuje apps/web/PLAN-WYDANIA.md. Powiązanie GitHub i Drive nie zmienia Site
ani produkcyjnej bazy. Nie zapisuj sekretów, kluczy podpisu ani danych użytkowników
w repo/raportach. Vercel może stanowić oddzielne wdrożenie, po wskazaniu celu;
nie jest wymagany do wspólnej pracy w GitHub i Drive.
