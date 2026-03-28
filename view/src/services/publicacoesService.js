import api from "../core/api";
import { getCache, setCache } from "../utils/browserCache";

const CACHE_KEY = "publicacoes-feed";
const CACHE_TTL = 60_000;

export async function listarPublicacoes() {
  const cached = getCache(CACHE_KEY);
  if (cached) return cached;
  const { data } = await api.get("/publicacao/");
  const payload = Array.isArray(data) ? data : [];
  setCache(CACHE_KEY, payload, CACHE_TTL);
  return payload;
}

export async function buscarPublicacaoPorId(id) {
  const publicacoes = await listarPublicacoes();
  return publicacoes.find((item) => String(item.id) === String(id)) || null;
}
