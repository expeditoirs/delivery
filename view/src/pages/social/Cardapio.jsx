import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";

import api from "../../core/api";
import { CarrinhoContext } from "../../context/CarrinhoContext";
import { ItemCardSkeleton } from "../../components/Skeleton";
import { getVersionedCache, setVersionedCache } from "../../utils/browserCache";

const CARDAPIO_TTL = 5 * 60_000;

function normalizeFallbackCategorias(items = []) {
  if (!Array.isArray(items) || !items.length) return [];
  return [
    {
      id: `fallback-${items[0]?.id_empresa || 'empresa'}`,
      nome: 'Outros',
      itens: items.filter((item) => item?.ativo !== false),
    },
  ];
}

export default function FinalCardapio() {
  const { empresa_id } = useParams();
  const navigate = useNavigate();
  const { adicionar } = useContext(CarrinhoContext);
  const cacheKey = `cardapio:${empresa_id}`;
  const cached = getVersionedCache(cacheKey);

  const [categorias, setCategorias] = useState(() => cached?.data?.categorias || []);
  const [loading, setLoading] = useState(() => !cached?.data);
  const [addedId, setAddedId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    function handleInvalidation() {
      setLoading(true);
      setReloadToken((current) => current + 1);
    }

    window.addEventListener('catalog-cache-invalidated', handleInvalidation);
    return () => {
      window.removeEventListener('catalog-cache-invalidated', handleInvalidation);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCardapio() {
      try {
        const { data: versionPayload } = await api.get(`/empresa/${empresa_id}/cardapio/version`);
        const nextVersion = versionPayload?.cache_version ?? 1;

        if (cached?.data && cached.version === nextVersion && (cached.data.categorias || []).length) {
          setLoading(false);
          return;
        }

        const { data } = await api.get(`/empresa/${empresa_id}/cardapio`);
        if (!active) return;

        let categoriasNormalizadas = data.categorias || [];

        if (!categoriasNormalizadas.length) {
          const { data: itensData } = await api.get(`/empresa/${empresa_id}/itens`, { params: { limit: 200 } });
          if (!active) return;
          categoriasNormalizadas = normalizeFallbackCategorias(itensData);
        }

        const payload = {
          ...data,
          categorias: categoriasNormalizadas,
        };

        setCategorias(categoriasNormalizadas);
        setVersionedCache(cacheKey, payload, data.cache_version ?? nextVersion, CARDAPIO_TTL);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCardapio();

    return () => {
      active = false;
    };
  }, [cacheKey, cached?.data, cached?.version, empresa_id, reloadToken]);

  function handleAdicionar(e, item) {
    e.stopPropagation();
    if (item.tipo_produto === "pizza" || item.tipo_produto === "acai") {
      navigate(`/produto/${item.id}`);
      return;
    }
    adicionar(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-6 bg-theme-background">
        <div className="h-6 bg-theme-secondary/50 animate-pulse rounded-full w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!categorias.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-theme-muted bg-theme-background">
        <span className="material-icons text-5xl mb-3">menu_book</span>
        <p className="text-sm font-medium">Cardápio não disponível</p>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-theme-background">
      <div className="px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-theme-muted mb-3 hover:text-theme-text transition-colors"
        >
          <span className="material-icons text-xl">arrow_back</span>
          <span className="text-sm">Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-theme-text">Cardápio</h1>
      </div>

      <div className="space-y-7 px-4">
        {categorias.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold text-theme-muted uppercase tracking-widest whitespace-nowrap">
                {cat.nome}
              </h2>
              <div className="flex-1 h-px bg-theme-border" />
            </div>

            <div className="space-y-3">
              {cat.itens.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.id && navigate(`/produto/${item.id}`)}
                  className="bg-theme-surface rounded-2xl border border-theme-border shadow-sm p-4 flex items-center gap-4 cursor-pointer active:scale-98 transition-transform hover:bg-theme-hover"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-theme-text truncate">
                      {item.nome}
                    </h3>

                    <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">
                      {item.descricao}
                    </p>

                    <p className="text-theme-primary font-bold text-sm mt-1.5">
                      R$ {Number(item.preco).toFixed(2)}
                    </p>

                    {(item.tipo_produto === "pizza" ||
                      item.tipo_produto === "acai") && (
                      <p className="text-[11px] text-theme-muted mt-1">
                        Produto configurável
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-theme-secondary via-theme-surface to-theme-background rounded-xl flex items-center justify-center border border-theme-border">
                      <span className="material-icons text-theme-accent text-2xl">
                        fastfood
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAdicionar(e, item)}
                      className={`min-w-8 h-8 px-2 rounded-full flex items-center justify-center text-white font-bold transition-colors active:scale-90 ${
                        addedId === item.id
                          ? "bg-theme-accent"
                          : "bg-theme-primary hover:bg-theme-accent"
                      }`}
                    >
                      {item.tipo_produto === "pizza" ||
                      item.tipo_produto === "acai" ? (
                        <span className="material-icons text-sm">tune</span>
                      ) : addedId === item.id ? (
                        <span className="material-icons text-sm">check</span>
                      ) : (
                        <span className="text-lg leading-none">+</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
