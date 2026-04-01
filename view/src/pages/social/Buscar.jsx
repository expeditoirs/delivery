import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../core/api";
import { getCurrentUser } from "../../utils/auth";
import { getVersionedCache, setVersionedCache } from "../../utils/browserCache";
import { getStoreCategories } from "../../utils/storeCategories";

const SEARCH_CACHE_KEY = "buscar-base";
const SEARCH_CACHE_TTL = 2 * 60_000;

const CATEGORY_PRESETS = {
  pizza: { label: "Pizza", keywords: ["pizza", "pizzaria"] },
  acai: { label: "Acai", keywords: ["acai", "acaiteria", "sorveteria", "acai shop"] },
  burger: { label: "Hamburguer", keywords: ["hamburguer", "hamburgueria", "burger", "lanche"] },
  bebidas: { label: "Bebidas", keywords: ["bebida", "refrigerante", "suco", "agua"] },
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getUserProfileSnapshot(currentUser) {
  const profileKey = `perfil_usuario_${currentUser?.id || "atual"}`;

  try {
    const genericProfile = JSON.parse(localStorage.getItem("perfil") || "null");
    const scopedProfile = JSON.parse(localStorage.getItem(profileKey) || "null");
    const profile = scopedProfile || genericProfile || null;

    return {
      cidade_id: profile?.cidade_id || currentUser?.cidade_id || null,
      bairro_id: profile?.bairro_id || currentUser?.bairro_id || null,
      cidade: profile?.cidade || currentUser?.cidade || "",
      bairro: profile?.bairro || currentUser?.bairro || "",
      endereco: profile?.endereco || "",
      numero: profile?.numero || profile?.numero_endereco || "",
    };
  } catch {
    return {
      cidade_id: currentUser?.cidade_id || null,
      bairro_id: currentUser?.bairro_id || null,
      cidade: currentUser?.cidade || "",
      bairro: currentUser?.bairro || "",
      endereco: "",
      numero: "",
    };
  }
}

function resolveClientLocation(profile, bairros) {
  const resolved = {
    ...profile,
    cidade_id: profile?.cidade_id ? String(profile.cidade_id) : "",
    bairro_id: profile?.bairro_id ? String(profile.bairro_id) : "",
  };

  if (!resolved.bairro_id && resolved.bairro) {
    const bairroByName = (bairros || []).find((bairro) => normalizeText(bairro.nome) === normalizeText(resolved.bairro));
    if (bairroByName) {
      resolved.bairro_id = String(bairroByName.id);
      if (!resolved.cidade_id && bairroByName.id_cidade) {
        resolved.cidade_id = String(bairroByName.id_cidade);
      }
    }
  }

  return resolved;
}

export default function Buscar() {
  const currentUser = getCurrentUser();
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const cacheRef = useRef(getVersionedCache(SEARCH_CACHE_KEY));
  const [empresas, setEmpresas] = useState(() => cacheRef.current?.data?.empresas || []);
  const [itens, setItens] = useState(() => cacheRef.current?.data?.itens || []);
  const [empresaBairros, setEmpresaBairros] = useState(() => cacheRef.current?.data?.empresaBairros || []);
  const [bairros, setBairros] = useState(() => cacheRef.current?.data?.bairros || []);
  const [historico, setHistorico] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadingBase, setLoadingBase] = useState(() => !cacheRef.current?.data);
  const navigate = useNavigate();

  const categoriaSelecionada = CATEGORY_PRESETS[normalizeText(searchParams.get("categoria"))] || null;
  const profileSnapshot = useMemo(() => getUserProfileSnapshot(currentUser), [currentUser, reloadToken]);
  const localizacaoCliente = useMemo(
    () => resolveClientLocation(profileSnapshot, bairros),
    [bairros, profileSnapshot],
  );
  const filtroPorCoberturaAtivo = Boolean(categoriaSelecionada);
  const temCidadeCliente = Boolean(localizacaoCliente.cidade_id || localizacaoCliente.bairro_id);

  useEffect(() => {
    function handleCatalogInvalidation() {
      setReloadToken((current) => current + 1);
    }

    window.addEventListener("catalog-cache-invalidated", handleCatalogInvalidation);
    window.addEventListener("profile-changed", handleCatalogInvalidation);

    return () => {
      window.removeEventListener("catalog-cache-invalidated", handleCatalogInvalidation);
      window.removeEventListener("profile-changed", handleCatalogInvalidation);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBase() {
      setHistorico(JSON.parse(localStorage.getItem("historicoBusca") || "[]"));

      if (cacheRef.current?.data && reloadToken === 0) {
        setLoadingBase(false);
        return;
      }

      setLoadingBase(true);

      try {
        let nextVersion = cacheRef.current?.version ?? 1;

        try {
          const { data: versionData } = await api.get("/empresa/cache/version");
          nextVersion = versionData?.cache_version_global ?? nextVersion;
        } catch (versionError) {
          if (cacheRef.current?.data) {
            console.warn("Falha ao consultar versao do cache, usando dados locais.", versionError);
            setLoadingBase(false);
            return;
          }
          throw versionError;
        }

        if (cacheRef.current?.data && cacheRef.current.version === nextVersion) {
          setEmpresas(cacheRef.current.data.empresas || []);
          setItens(cacheRef.current.data.itens || []);
          setEmpresaBairros(cacheRef.current.data.empresaBairros || []);
          setBairros(cacheRef.current.data.bairros || []);
          setLoadingBase(false);
          return;
        }

        const [empresasRes, itensRes, empresaBairrosRes, bairrosRes] = await Promise.all([
          api.get("/empresa/"),
          api.get("/item/"),
          api.get("/empresa-bairros/"),
          api.get("/bairros/"),
        ]);
        if (!active) return;

        const payload = {
          empresas: empresasRes.data || [],
          itens: itensRes.data || [],
          empresaBairros: empresaBairrosRes.data || [],
          bairros: bairrosRes.data || [],
        };

        cacheRef.current = { data: payload, version: nextVersion, cachedAt: Date.now() };
        setEmpresas(payload.empresas);
        setItens(payload.itens);
        setEmpresaBairros(payload.empresaBairros);
        setBairros(payload.bairros);
        setVersionedCache(SEARCH_CACHE_KEY, payload, nextVersion, SEARCH_CACHE_TTL);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoadingBase(false);
      }
    }

    loadBase();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  function salvarHistorico(texto) {
    if (!texto) return;

    const novo = [texto, ...historico.filter((item) => item !== texto)].slice(0, 5);
    setHistorico(novo);
    localStorage.setItem("historicoBusca", JSON.stringify(novo));
  }

  const coberturaPorEmpresa = useMemo(() => {
    const bairroParaCidade = new Map((bairros || []).map((bairro) => [String(bairro.id), String(bairro.id_cidade)]));
    const coverage = new Map();

    for (const vinculo of empresaBairros || []) {
      const empresaId = String(vinculo.id_empresa);
      const bairroId = String(vinculo.id_bairro);
      const cidadeId = bairroParaCidade.get(bairroId);

      if (!coverage.has(empresaId)) {
        coverage.set(empresaId, { bairros: new Set(), cidades: new Set() });
      }

      const item = coverage.get(empresaId);
      item.bairros.add(bairroId);
      if (cidadeId) item.cidades.add(cidadeId);
    }

    return coverage;
  }, [bairros, empresaBairros]);

  const resultados = useMemo(() => {
    const termoBusca = normalizeText(busca);
    const keywordsCategoria = categoriaSelecionada?.keywords || [];
    const temFiltroTexto = Boolean(termoBusca || keywordsCategoria.length);

    if (!temFiltroTexto) {
      return { empresas: [], itens: [] };
    }

    const empresaAtendeCliente = (empresaId) => {
      if (!filtroPorCoberturaAtivo) return true;
      if (!temCidadeCliente) return false;

      const cobertura = coberturaPorEmpresa.get(String(empresaId));
      if (!cobertura) return false;

      if (localizacaoCliente.bairro_id && cobertura.bairros.has(String(localizacaoCliente.bairro_id))) {
        return true;
      }

      if (localizacaoCliente.cidade_id && cobertura.cidades.has(String(localizacaoCliente.cidade_id))) {
        return true;
      }

      return false;
    };

    const correspondeTexto = (value) => {
      const texto = normalizeText(value);
      if (!texto) return false;
      if (termoBusca && texto.includes(termoBusca)) return true;
      return keywordsCategoria.some((keyword) => texto.includes(normalizeText(keyword)));
    };

    const empresasFiltradas = empresas.filter((empresa) => {
      if (!empresaAtendeCliente(empresa.id)) return false;
      const categoriasLoja = getStoreCategories(empresa).join(" ");
      return correspondeTexto(empresa.nome_empresa) || correspondeTexto(empresa.categoria_empresa) || correspondeTexto(categoriasLoja);
    });

    const empresaIdsPermitidas = new Set(empresasFiltradas.map((empresa) => Number(empresa.id)));

    const itensFiltrados = itens.filter((item) => {
      if (!empresaIdsPermitidas.has(Number(item.id_empresa))) return false;
      return correspondeTexto(item.nome) || correspondeTexto(item.descricao);
    });

    return {
      empresas: empresasFiltradas,
      itens: itensFiltrados,
    };
  }, [busca, categoriaSelecionada, coberturaPorEmpresa, empresas, filtroPorCoberturaAtivo, itens, localizacaoCliente.bairro_id, localizacaoCliente.cidade_id, temCidadeCliente]);

  useEffect(() => {
    if (busca.trim()) salvarHistorico(busca.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const tituloContexto = categoriaSelecionada
    ? `${categoriaSelecionada.label}${localizacaoCliente.cidade ? ` em ${localizacaoCliente.cidade}` : ""}`
    : "Busca";

  return (
    <div className="theme-page pb-20">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-3 space-y-3">
          <div className="theme-glass flex items-center gap-3 rounded-3xl px-4 py-3">
            <span className="material-icons text-theme-accent text-xl">search</span>

            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar restaurantes ou pratos"
              className="theme-title flex-1 bg-transparent text-sm outline-none placeholder:text-theme-muted"
            />
          </div>

          {categoriaSelecionada && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {tituloContexto}
              </span>
              {localizacaoCliente.bairro && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-theme-muted">
                  Bairro: {localizacaoCliente.bairro}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-5">
        {loadingBase && !empresas.length && !itens.length && (
          <div className="theme-muted flex flex-col items-center py-16">
            <div className="theme-glass mb-4 flex h-20 w-20 items-center justify-center rounded-3xl">
              <span className="material-icons theme-muted text-5xl animate-spin">progress_activity</span>
            </div>
            <p className="theme-title font-medium">Carregando vitrine</p>
          </div>
        )}

        {categoriaSelecionada && !temCidadeCliente && (
          <div className="theme-glass rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="theme-title text-sm font-semibold">Defina sua cidade para filtrar as lojas dessa categoria</p>
            <p className="theme-muted mt-1 text-sm">
              Precisamos do seu endereco completo para mostrar apenas lojas que atendem sua regiao.
            </p>
            {!!localizacaoCliente.endereco && (
              <p className="theme-muted mt-2 text-xs">
                Endereco atual: {[localizacaoCliente.endereco, localizacaoCliente.numero, localizacaoCliente.bairro].filter(Boolean).join(", ")}
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate("/endereco")}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105"
            >
              <span className="material-icons text-base">location_on</span>
              Completar endereco
            </button>
          </div>
        )}

        {!busca && !categoriaSelecionada && historico.length > 0 && (
          <div>
            <h2 className="theme-muted mb-3 text-sm font-bold uppercase tracking-[0.18em]">
              Buscas recentes
            </h2>

            <div className="flex flex-wrap gap-2">
              {historico.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setBusca(h)}
                  className="theme-glass theme-title rounded-2xl px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {!busca && !categoriaSelecionada && !historico.length && !loadingBase && (
          <div className="theme-muted flex flex-col items-center py-16">
            <div className="theme-glass mb-4 flex h-20 w-20 items-center justify-center rounded-3xl">
              <span className="material-icons theme-muted text-5xl">search</span>
            </div>
            <p className="theme-title font-medium">Busque restaurantes e pratos</p>
            <p className="theme-muted mt-1 text-sm">
              Descubra lojas, comidas e itens do app
            </p>
          </div>
        )}

        {(busca || categoriaSelecionada) && !resultados.empresas.length && !resultados.itens.length && (!categoriaSelecionada || temCidadeCliente) && !loadingBase && (
          <div className="theme-muted flex flex-col items-center py-16">
            <div className="theme-glass mb-4 flex h-20 w-20 items-center justify-center rounded-3xl">
              <span className="material-icons theme-muted text-5xl">search_off</span>
            </div>
            <p className="theme-title font-medium">Nenhum resultado</p>
            <p className="theme-muted mt-1 text-sm text-center">
              {categoriaSelecionada
                ? `Nao encontramos lojas de ${categoriaSelecionada.label.toLowerCase()} atendendo sua regiao agora.`
                : "Tente buscar com outro nome ou palavra-chave"}
            </p>
          </div>
        )}

        {!!resultados.empresas.length && (
          <div>
            <h2 className="theme-muted mb-3 text-sm font-bold uppercase tracking-[0.18em]">
              Restaurantes
            </h2>

            <div className="space-y-3">
              {resultados.empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => navigate(`/cardapio/${empresa.id}`)}
                  className="theme-glass flex w-full items-center gap-3 rounded-3xl p-4 text-left transition hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-theme bg-blue-500/10">
                    <span className="material-icons text-theme-primary">restaurant</span>
                  </div>

                  <div className="min-w-0">
                    <p className="theme-title text-sm font-semibold">
                      {empresa.nome_empresa}
                    </p>
                    <p className="theme-muted text-xs">
                      {getStoreCategories(empresa).join(" • ") || empresa.categoria_empresa || "Restaurante"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!!resultados.itens.length && (
          <div>
            <h2 className="theme-muted mb-3 text-sm font-bold uppercase tracking-[0.18em]">
              Pratos
            </h2>

            <div className="space-y-3">
              {resultados.itens.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/produto/${item.id}`)}
                  className="theme-glass flex w-full items-center gap-3 rounded-3xl p-4 text-left transition hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-theme bg-emerald-500/10">
                    <span className="material-icons text-theme-accent">fastfood</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="theme-title truncate text-sm font-semibold">
                      {item.nome}
                    </p>
                    <p className="theme-muted truncate text-xs">
                      {item.descricao}
                    </p>
                  </div>

                  <span className="ml-auto text-sm font-bold text-theme-primary">
                    R$ {Number(item.preco || 0).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}