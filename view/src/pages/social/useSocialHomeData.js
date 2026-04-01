import { useEffect, useMemo, useState } from "react";
import api from "../../core/api";
import { getCurrentUser } from '../../utils/auth';
import { getVersionedCache, setVersionedCache } from "../../utils/browserCache";

const HOME_CACHE_KEY = "home-social-v2";
const HOME_CACHE_TTL = 60_000;

export default function useSocialHomeData() {
  const currentUser = getCurrentUser();
  const viewerUserId = currentUser?.id ?? null;
  const scopedCacheKey = viewerUserId ? `${HOME_CACHE_KEY}:${viewerUserId}` : HOME_CACHE_KEY;
  const cached = getVersionedCache(scopedCacheKey);
  const [empresas, setEmpresas] = useState(() => cached?.data?.empresas || []);
  const [stories, setStories] = useState(() => cached?.data?.stories || []);
  const [publicacoes, setPublicacoes] = useState(() => cached?.data?.publicacoes || []);
  const [loading, setLoading] = useState(() => !cached?.data);
  const [erro, setErro] = useState("");
  const [storyAberto, setStoryAberto] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    function handleInvalidation() {
      setReloadToken((current) => current + 1);
    }

    window.addEventListener('catalog-cache-invalidated', handleInvalidation);
    window.addEventListener('social-feed-updated', handleInvalidation);
    return () => {
      window.removeEventListener('catalog-cache-invalidated', handleInvalidation);
      window.removeEventListener('social-feed-updated', handleInvalidation);
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarHome() {
      setLoading((prev) => prev && !empresas.length && !stories.length && !publicacoes.length);
      setErro("");
      try {
        const { data: versionData } = await api.get("/empresa/cache/version");
        const nextVersion = versionData?.cache_version_global ?? 1;

        if (cached?.data && cached.version === nextVersion) {
          setLoading(false);
          return;
        }

        const [empresasRes, storiesRes, publicacoesRes] = await Promise.all([
          api.get("/empresa/"),
          api.get("/story/", { params: { limit: 20 } }),
          api.get("/publicacao/", { params: { limit: 30, ...(viewerUserId ? { viewer_user_id: viewerUserId } : {}) } }),
        ]);

        if (!ativo) return;

        const payload = {
          empresas: Array.isArray(empresasRes.data) ? empresasRes.data : [],
          stories: Array.isArray(storiesRes.data) ? storiesRes.data : [],
          publicacoes: Array.isArray(publicacoesRes.data) ? publicacoesRes.data : [],
        };

        setEmpresas(payload.empresas);
        setStories(payload.stories);
        setPublicacoes(payload.publicacoes);
        setVersionedCache(scopedCacheKey, payload, nextVersion, HOME_CACHE_TTL);
      } catch (error) {
        console.error(error);
        if (!ativo) return;
        setErro("Nao foi possivel carregar a experiencia completa agora.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarHome();

    return () => {
      ativo = false;
    };
  }, [cached?.data, cached?.version, empresas.length, publicacoes.length, stories.length, reloadToken, scopedCacheKey, viewerUserId]);

  const feed = useMemo(() => [...publicacoes], [publicacoes]);

  return {
    empresas,
    stories,
    publicacoes,
    feed,
    loading,
    erro,
    storyAberto,
    setStoryAberto,
    reloadFeed: () => setReloadToken((current) => current + 1),
  };
}