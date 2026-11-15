# co na talerzu

Wspólny katalog roboczy obejmuje aplikację w apps/web, Skills w .agents/skills,
backlog w docs/BACKLOG.md i procedury w docs/WORKFLOW.md.
Przed pracą przeczytaj docs/STAN-SCALENIA.md oraz project.config.json.
Kontynuuj istniejący stack PWA/JavaScript/Capacitor. Expo/React Native/TypeScript
to propozycja wcześniejszego wątku Skills, nie zatwierdzona migracja działającego kodu.
Identyfikatory aplikacji i nazwy kluczy localStorage zachowuj do czasu osobnej migracji.
Nie nadpisuj źródeł w pierwotnych katalogach. Późniejsze pliki pobieraj skryptem
scripts/import-source.mjs, a konflikty rozstrzygaj jawnie z zachowaniem obu wersji.
Testy i build: npm test oraz npm run build z katalogu głównego.
GitHub jest docelowym miejscem kodu/PR/backlogu, Drive raportów i materiałów.
Nie traktuj pustych identyfikatorów integracji jako działających połączeń.
Skills to instrukcje dla wykonującego zadanie, nie uruchomione usługi ani agenci.
