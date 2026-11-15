# Rozstrzygnięcia

2026-11-15: drugi import aplikacji wykrył jedną różnicę: apps/web/TESTY.md.
Porównanie git diff --no-index wykazało wyłącznie dopisany wynik testu offline
przeprowadzonego w źródłowym wątku. Przyjęto nowszy raport. Pierwszą kopię zachowano
w archive/source-before-resolution/TESTY.md, drugą w migration/conflicts.
To dowód z wątku źródłowego; sesja konsolidacji nie powtarzała tego testu UI.
Brak otwartych konfliktów tego importu. Zmiany Skills względem oryginałów:
nazwa projektu w treści, odnośniki do wspólnej dokumentacji, kontekst PWA/Capacitor
w stack.md wszystkich ról, opis programisty i publikacji oraz warunkowość EAS.
Źródłowe sumy importu nie są sumami później dostosowanych plików.
