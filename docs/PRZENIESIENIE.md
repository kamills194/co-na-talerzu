# Dołączanie późniejszych wyników

Nie kopiuj nowych plików na istniejące z opcją zastąpienia. W źródłach nadal trwa praca.
Najpierw zaczekaj na zapis plików i potwierdź ich stan w odpowiednim wątku.

Z katalogu głównego wspólnego repo:

```powershell
node scripts/import-source.mjs app 'C:\Users\kamil\Documents\Codex\2026-11-15\referenced-chatgpt-conversation-this-is-an-4\outputs\co-na-talerz'
node scripts/import-source.mjs skills 'C:\Users\kamil\Documents\Codex\2026-11-15\referenced-chatgpt-conversation-this-is-an-5\outputs'
```

Jeśli Skills powstaną tylko jako ZIP, rozpakuj je najpierw do osobnego katalogu
work poza wspólnym repo i podaj ten katalog jako źródło. Nie uruchamiaj zawartych
skryptów podczas importu. Importer wyszukuje katalogi z SKILL.md i zachowuje ich
nazwy oraz pliki w .agents/skills. Nie instaluje nic globalnie.

Importer nie zastępuje żadnego istniejącego pliku. Identyczne pomija, nowe kopiuje,
a zmienione zachowuje w migration/conflicts/ZNACZNIK-CZASU. Każdy import zapisuje
manifest SHA-256. Brak SKILL.md kończy import Skills błędem, bez twierdzenia o sukcesie.
Nie usuwa plików, które zniknęły ze źródła. Konflikty scal ręcznie w gałęzi CNT-012,
uwzględniając również lokalne zmiany; następnie wykonaj testy i build.

Przed uznaniem CNT-002 za gotowe sprawdź siedem ról: koordynator, programista,
ekspert kulinarny, promocje sklepowe, UX/UI i lokalizacja, QA, publikacja Android/iOS.
Każdy Skill powinien mieć YAML name/description, agents/openai.yaml i poprawne
odnośniki do references. Użyj quick_validate.py z zainstalowanego skill-creator,
jeśli Python jest dostępny; to kontrola struktury, nie dowód działania procedur.
Przeczytaj wskazówki o Expo: dopasuj je do rzeczywistego stacku bez zmiany kodu na ślepo.
Zaktualizuj STAN-SCALENIA.md i BACKLOG.md dopiero po sprawdzeniu faktycznych plików.

Otwórz ten katalog jako wspólny projekt Codex. Przypisanie istniejących czatów do
projektu w panelu bocznym wykonaj po dodaniu tego katalogu; same czaty nadal mają
własny kontekst i mogą wymagać jawnego wskazania wspólnej ścieżki do dalszej pracy.
