import api from "../core/api";
import { getCurrentUser } from "../utils/auth";
import { clearCacheByPrefix, getCache, setCache } from "../utils/browserCache";

const CACHE_KEY = "publicacoes-feed";
const CACHE_TTL = 60_000;

export async function listarPublicacoes() {
  const currentUser = getCurrentUser();
  const cacheKey = currentUser?.id ? `${CACHE_KEY}:${currentUser.id}` : CACHE_KEY;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const { data } = await api.get("/publicacao/", {
    params: currentUser?.id ? { viewer_user_id: currentUser.id } : {},
  });
  const payload = Array.isArray(data) ? data : [];
  setCache(cacheKey, payload, CACHE_TTL);
  return payload;
}

export async function criarPublicacao(payload) {
  const { data } = await api.post('/publicacao/', payload);
  clearCacheByPrefix(CACHE_KEY);
  clearCacheByPrefix('home-social-v2');
  window.dispatchEvent(new CustomEvent('social-feed-updated'));
  return data;
}

export async function buscarPublicacaoPorId(id) {
  const publicacoes = await listarPublicacoes();
  return publicacoes.find((item) => String(item.id) === String(id)) || null;
}