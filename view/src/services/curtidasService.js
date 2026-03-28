const STORAGE_KEY = "curtidas_publicacoes";

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function obterCurtida(publicacaoId) {
  const storage = readStorage();
  return Boolean(storage[publicacaoId]?.liked);
}

export function obterQuantidadeCurtidas(publicacaoId) {
  const storage = readStorage();
  return Number(storage[publicacaoId]?.count || 0);
}

export function alternarCurtida(publicacaoId, baseCount = 0) {
  const storage = readStorage();
  const atual = storage[publicacaoId] || { liked: false, count: baseCount };
  const liked = !atual.liked;
  const count = liked ? atual.count + 1 : Math.max(0, atual.count - 1);

  storage[publicacaoId] = { liked, count };
  writeStorage(storage);
  return storage[publicacaoId];
}
