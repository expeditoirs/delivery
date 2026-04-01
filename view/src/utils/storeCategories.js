export const STORE_CATEGORY_OPTIONS = [
  "Pizzaria",
  "Hamburgueria",
  "Acai",
  "Bebidas",
  "Lanches",
  "Marmitaria",
  "Japonesa",
  "Massas",
  "Doces",
  "Sorvetes",
];

export function normalizeStoreCategories(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index);
  }

  if (typeof input === "string") {
    const raw = input.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeStoreCategories(parsed);
    } catch {
      // fallback to comma separated parsing
    }

    return normalizeStoreCategories(raw.split(","));
  }

  return [];
}

export function getStoreCategories(store) {
  const categories = normalizeStoreCategories(store?.categorias_empresa);
  if (categories.length) return categories;
  return normalizeStoreCategories(store?.categoria_empresa);
}

export function getPrimaryStoreCategory(store) {
  return getStoreCategories(store)[0] || store?.categoria_empresa || "";
}

export function formatStoreCategories(store, fallback = "Loja") {
  const categories = getStoreCategories(store);
  return categories.length ? categories.join(" • ") : fallback;
}