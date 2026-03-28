const STORAGE_KEY = "comentarios_publicacoes";

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

export function listarComentarios(publicacaoId) {
  const storage = readStorage();
  return storage[publicacaoId] || [];
}

export function adicionarComentario(publicacaoId, comentario) {
  const storage = readStorage();
  const atual = storage[publicacaoId] || [];
  const novoComentario = {
    id: Date.now(),
    criado_em: new Date().toISOString(),
    ...comentario,
  };

  storage[publicacaoId] = [novoComentario, ...atual];
  writeStorage(storage);
  return storage[publicacaoId];
}
