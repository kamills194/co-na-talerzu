import { language } from './i18n.js';

const rows = {
  terms:['Regulamin','Terms','Nutzungsbedingungen','Правила','Conditions','Vilkår','Condiciones','Condizioni'],
  more:['Pokaż więcej','Show more','Mehr anzeigen','Показати більше','Afficher plus','Vis flere','Mostrar más','Mostra di più'],
  sourceRecipes:['Przepisy z otwartych źródeł','Recipes from open sources','Rezepte aus offenen Quellen','Рецепти з відкритих джерел','Recettes de sources ouvertes','Opskrifter fra åbne kilder','Recetas de fuentes abiertas','Ricette da fonti aperte'],
  sourceRecipe:['Przepis ze źródła','Recipe from a source','Rezept aus einer Quelle','Рецепт із джерела','Recette issue d’une source','Opskrift fra en kilde','Receta de una fuente','Ricetta da una fonte'],
  translated:['Tłumaczenie automatyczne','Machine translation','Maschinelle Übersetzung','Машинний переклад','Traduction automatique','Maskinoversættelse','Traducción automática','Traduzione automatica'],
  allergy:['Lista alergenów może być niepełna. Sprawdź skład produktów.','Allergen information may be incomplete. Check product labels.','Allergenangaben können unvollständig sein. Prüfe die Zutatenliste.','Дані про алергени можуть бути неповними. Перевірте склад продуктів.','La liste des allergènes peut être incomplète. Vérifiez les étiquettes.','Listen over allergener kan være ufuldstændig. Tjek varedeklarationen.','La lista de alérgenos puede estar incompleta. Revisa las etiquetas.','Le informazioni sugli allergeni possono essere incomplete. Controlla le etichette.'],
  find:['Szukam przepisu w internecie…','Searching the web for a recipe…','Rezeptsuche im Internet…','Шукаємо рецепт в інтернеті…','Recherche de recette sur le web…','Søger efter en opskrift på nettet…','Buscando una receta en internet…','Ricerca della ricetta sul web…'],
  findRetry:['Szukaj w internecie','Search the web','Im Internet suchen','Шукати в інтернеті','Rechercher sur le web','Søg på nettet','Buscar en internet','Cerca sul web'],
  findEmpty:['Brak potwierdzonego przepisu w dostępnych źródłach.','No matching recipe was confirmed in the available sources.','Keine bestätigten Rezepte in den verfügbaren Quellen.','У доступних джерелах немає підтвердженого рецепта.','Aucune recette confirmée dans les sources disponibles.','Ingen bekræftet opskrift i de tilgængelige kilder.','No se ha confirmado ninguna receta en las fuentes disponibles.','Nessuna ricetta confermata nelle fonti disponibili.'],
  findError:['Wyszukiwanie online jest chwilowo niedostępne.','Online search is temporarily unavailable.','Die Onlinesuche ist vorübergehend nicht verfügbar.','Онлайн-пошук тимчасово недоступний.','La recherche en ligne est temporairement indisponible.','Onlinesøgning er midlertidigt utilgængelig.','La búsqueda en línea no está disponible temporalmente.','La ricerca online è temporaneamente non disponibile.'],
  baskets:['Koszyki według sklepu','Baskets by store','Warenkörbe nach Geschäft','Кошики за магазинами','Paniers par magasin','Indkøbskurve efter butik','Cestas por tienda','Carrelli per negozio'],
  basketNote:['Szacunek na podstawie aktualnych ofert. Sprawdź dostępność w swoim sklepie. Produkty bez wyceny są poza sumą.','Estimate based on current offers. Check availability at your store. Unpriced items are excluded from the sum.','Schätzung anhand aktueller Angebote. Artikel ohne Preis zählen nicht zur Summe.','Оцінка за чинними пропозиціями. Товари без ціни не входять у суму.','Estimation selon les offres en cours. Les articles sans prix sont exclus du total.','Skøn ud fra aktuelle tilbud. Varer uden pris indgår ikke i summen.','Estimación según ofertas vigentes. El total excluye los artículos sin precio.','Stima basata sulle offerte attive. Gli articoli senza prezzo sono esclusi dal totale.'],
  basketEmpty:['Brak aktualnych ofert do wyceny.','No current offers to price.','Keine aktuellen Angebote zur Preisberechnung.','Немає актуальних пропозицій для оцінки.','Aucune offre en cours pour le calcul.','Ingen aktuelle tilbud til beregning.','No hay ofertas vigentes para calcular el precio.','Nessuna offerta attiva per la stima.'],
  subtotal:['Suma wycenionych','Priced subtotal','Zwischensumme','Сума оцінених','Sous-total des articles chiffrés','Beregnet delsum','Subtotal estimado','Subtotale stimato'],
  missing:['Bez wyceny','Unpriced','Ohne Preis','Без ціни','Sans estimation','Uden pris','Sin precio','Senza prezzo'],
  conditions:['Wymaga sprawdzenia warunków lub jednostki','Check offer terms or unit','Angebotsbedingungen oder Einheit prüfen','Перевірте умови або одиницю виміру','Vérifiez les conditions ou l’unité','Tjek vilkår eller enhed','Comprueba las condiciones o la unidad','Verifica condizioni o unità'],
  portions:['Porcje według źródła','Servings in source','Portionen laut Quelle','Порцій за джерелом','Portions selon la source','Portioner i kilden','Raciones de la fuente','Porzioni della fonte'],
};
const languages = ['pl','en','de','uk','fr','da','es','it'];
export const feature = key => rows[key]?.[languages.indexOf(language)] ?? key;
const regions = {
  jewish:['Żydowska','Jewish'], russian:['Rosyjska','Russian'], czech:['Czeska','Czech'],
  levantine:['Bliskowschodnia','Middle Eastern'], international:['Międzynarodowa','International'],
};
export const extraCuisines = Object.keys(regions);
export const extraCuisine = code => regions[code]?.[language === 'en' ? 1 : 0] ?? '';
