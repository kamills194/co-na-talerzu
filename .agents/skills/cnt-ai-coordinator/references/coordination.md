# Mapa ról i gotowości

| Rola / Skill | Zakres | Dowód przekazania |
|---|---|---|
| cnt-ai-coordinator | priorytety, zależności, kryteria | macierz i briefy |
| cnt-mobile-developer | implementacja i migracje | diff/PR i testy |
| cnt-culinary-expert | przepisy, porcje, alergeny | rekordy i źródła |
| cnt-store-promotions | oferty i koszt koszyka | pochodzenie, warunki, walidacja |
| cnt-ux-localization | przepływy, dostępność, teksty | ekrany/zmiany i weryfikacja języka |
| cnt-quality-assurance | ryzyka i weryfikacja kandydata | raport na SHA/build ID |
| cnt-mobile-release | pakowanie, submission, rollout | manifest i status sklepu |

Nazwy służą routingowi; każdy pakiet działa także oddzielnie i nie wymaga instalacji pozostałych.

Brief: problem i użytkownik; repo/ref/SHA; dozwolony zakres; kryteria Given/When/Then; wejścia/źródła; zależności; oczekiwany artefakt; testy; zakres zewnętrznych zapisów. Osobno wskaż nieustalone decyzje. Statusy: PLANNED, IN_PROGRESS tylko po rozpoczęciu, BLOCKED z przyczyną, READY_FOR_REVIEW z dowodami, DONE po spełnieniu kryteriów.

Przykład zależności „tańszy jadłospis bez orzechów”: ekspert ustala wykluczenia i niepewności → promocje mapują towary i ceny → programista łączy kontrakty → UX opisuje brak bezpiecznych ofert → QA weryfikuje alergie i koszyk → publikacja ocenia kandydata. Brak źródła alergenu blokuje oznaczenie „bezpieczny”, nie analizę kosztu dla pozostałych produktów.

Macierz gotowości ma wiersz na kryterium: status, właściciel roli, SHA/build ID, dowód, ryzyko, kolejny krok. Nie agreguj NOT_RUN do PASS. Zmiana kodu po QA wymaga oceny zakresu ponownej weryfikacji. Otwarte ryzyko bezpieczeństwa żywności, wycieku danych lub uszkodzenia danych oznacza NO_GO do wydania do czasu usunięcia.
