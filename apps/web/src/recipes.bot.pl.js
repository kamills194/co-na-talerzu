// Dania dodane przez bota „kucharz” (scripts/bots/chef.mjs). PLIK GENEROWANY — nie edytuj ręcznie.
// Każdy wpis przeszedł walidację (scripts/bots/chef-validate.mjs) i niezależną weryfikację ze źródłami.
// products: [nazwa, jednostka, alergeny]; kinds: plant|dairy|egg|meat|fish|animal (dieta liczona z nich);
// nutrition: [kcal, białko, tłuszcz, węglowodany] na 100 g; unitGrams: gramy jednej jednostki (nie g/ml).
export const data = {
 "products": {
  "hotpaprika": [
   "Papryka ostra mielona",
   "łyżeczka",
   []
  ]
 },
 "kinds": {
  "hotpaprika": "plant"
 },
 "nutrition": {
  "hotpaprika": [
   282,
   14,
   13,
   54
  ]
 },
 "unitGrams": {
  "hotpaprika": 2.5
 },
 "recipes": [
  {
   "id": "lecso",
   "category": "lunch",
   "cuisine": "hungarian",
   "name": "Lecsó, węgierskie duszone papryki z pomidorami",
   "minutes": 40,
   "vegan": true,
   "vegetarian": true,
   "emoji": "🫑",
   "servings": 2,
   "ingredients": [
    {
     "product": "pepper",
     "amount": 4
    },
    {
     "product": "tomato",
     "amount": 3
    },
    {
     "product": "onion",
     "amount": 1
    },
    {
     "product": "oil",
     "amount": 30
    },
    {
     "product": "paprika",
     "amount": 1
    },
    {
     "product": "hotpaprika",
     "amount": 0.5
    },
    {
     "product": "salt",
     "amount": 0.5
    }
   ],
   "allergens": [],
   "steps": [
    "Papryki umyj, usuń gniazda nasienne i pokrój w paski. Cebulę obierz i pokrój w piórka.",
    "Na patelni rozgrzej olej i szklij cebulę 5 minut na średnim ogniu.",
    "Dodaj paprykę, oprósz papryką słodką i ostrą, posól i duś pod przykryciem 10 minut.",
    "Pomidory sparz, obierz, pokrój w kostkę i dodaj do patelni. Duś bez przykrycia 15 minut, aż sos zgęstnieje."
   ],
   "origin": "Przepis opracowany przez bota redakcji Co na talerz i sprawdzony automatycznie ze źródłami",
   "review": "bot",
   "photo": null,
   "photoAlt": "Głęboki talerz duszonych pasków papryki w gęstym sosie pomidorowym",
   "sources": [
    "https://example.org/lecso-recipe"
   ]
  }
 ]
};
