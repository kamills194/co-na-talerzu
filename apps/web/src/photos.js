// Rejestr praw do zdjęć (docs/PILOT-PL.md, „Zdjęcia i rejestr praw”).
// Kluczem jest ID zdjęcia wpisane w polu `photo` przepisu. Rejestr jest celowo PUSTY:
// wpis wolno dodać dopiero razem z prawdziwym plikiem i potwierdzonym prawem użycia.
// Nie dodawaj obrazów zastępczych, generowanych ani wpisów „na próbę”.
//
// Kształt rekordu:
//   file          ścieżka pliku względem katalogu aplikacji, np. './photos/owsianka.webp'
//   author        autor fotografii
//   sourceUrl     adres strony źródłowej (https://…)
//   license       nazwa licencji lub podstawa dysponowania prawami
//   licenseUrl    adres licencji albo dowodu zgody (https://…)
//   acquired      data pozyskania, RRRR-MM-DD
//   usage         dozwolony sposób użycia
//   attribution   wymagany tekst oznaczenia autora — pokazywany w aplikacji przy zdjęciu
//   modifications opis zmian względem oryginału (np. kadrowanie), '' gdy brak
//   sha256        suma SHA-256 pliku
export const photos = {};

const filled = value => typeof value === 'string' && value.trim() !== '';
// Bez tych pól zdjęcie nie może być pokazane: brak pliku albo brak oznaczenia praw.
export const requiredPhotoFields = ['file', 'author', 'license', 'attribution'];

// Zwraca rekord rejestru tylko dla przepisu z przypisanym zdjęciem i kompletnym wpisem praw.
// W każdym innym przypadku null — interfejs pokazuje wtedy zaprojektowaną grafikę z emoji.
export function photoFor(recipe, registry = photos) {
  const id = recipe?.photo;
  if (!filled(id) || !Object.hasOwn(registry, id)) return null;
  const record = registry[id];
  if (!record || typeof record !== 'object') return null;
  return requiredPhotoFields.every(field => filled(record[field])) ? record : null;
}

// Odnośniki z rejestru trafiają do atrybutu href, więc dopuszczamy wyłącznie https.
export function safeLink(url) { return filled(url) && /^https:\/\/[^\s"'<>]+$/.test(url) ? url : ''; }
