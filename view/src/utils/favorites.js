export function getStoredFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favoritos') || '[]');
  } catch {
    return [];
  }
}

export function saveStoredFavorites(items) {
  localStorage.setItem('favoritos', JSON.stringify(items));
}

export function toggleFavorito(item) {
  const favoritos = getStoredFavorites();
  const existe = favoritos.find((favorite) => favorite.id === item.id);

  const novo = existe
    ? favoritos.filter((favorite) => favorite.id !== item.id)
    : [...favoritos, item];

  saveStoredFavorites(novo);
  return !existe;
}
