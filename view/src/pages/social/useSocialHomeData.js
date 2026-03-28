import { useEffect, useMemo, useState } from "react";
import api from "../../core/api";
import { getCache, setCache } from "../../utils/browserCache";

const HOME_CACHE_KEY = "home-social-v1";
const HOME_CACHE_TTL = 60_000;

export default function useSocialHomeData() {
  const [empresas, setEmpresas] = useState(() => getCache(HOME_CACHE_KEY)?.empresas || []);
  const [stories, setStories] = useState(() => getCache(HOME_CACHE_KEY)?.stories || []);
  const [publicacoes, setPublicacoes] = useState(() => getCache(HOME_CACHE_KEY)?.publicacoes || []);
  const [loading, setLoading] = useState(() => !getCache(HOME_CACHE_KEY));
  const [erro, setErro] = useState("");
  const [storyAberto, setStoryAberto] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarHome() {
      setLoading((prev) => prev && !empresas.length && !stories.length && !publicacoes.length);
      setErro("");
      try {
        const [empresasRes, storiesRes, publicacoesRes] = await Promise.all([
          api.get("/empresa/"),
          api.get("/story/"),
          api.get("/publicacao/"),
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
        setCache(HOME_CACHE_KEY, payload, HOME_CACHE_TTL);
      } catch (error) {
        console.error(error);
        if (!ativo) return;
        setErro("Não foi possível carregar a experiência completa agora.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarHome();

    return () => {
      ativo = false;
    };
  }, []);

  const feed = useMemo(
    () => [...publicacoes].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)),
    [publicacoes],
  );

  return {
    empresas,
    stories,
    publicacoes,
    feed,
    loading,
    erro,
    storyAberto,
    setStoryAberto,
  };
}
