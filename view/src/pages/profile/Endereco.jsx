import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../core/api";
import { getCurrentStore, getCurrentUser, saveAuth } from "../../utils/auth";

const ESTADOS = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "AP", nome: "Amapa" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceara" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espirito Santo" },
  { uf: "GO", nome: "Goias" },
  { uf: "MA", nome: "Maranhao" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "PA", nome: "Para" },
  { uf: "PB", nome: "Paraiba" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piaui" },
  { uf: "PR", nome: "Parana" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RO", nome: "Rondonia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "SP", nome: "Sao Paulo" },
  { uf: "TO", nome: "Tocantins" },
];

function getPerfilStorageKey(currentStore, currentUser) {
  if (currentStore) {
    return `perfil_loja_${currentStore.id || "atual"}`;
  }
  return `perfil_usuario_${currentUser?.id || "atual"}`;
}

function emitProfileChanged() {
  window.dispatchEvent(new Event("profile-changed"));
}

export default function Endereco() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentStore = getCurrentStore();

  const perfilStorageKey = useMemo(
    () => getPerfilStorageKey(currentStore, currentUser),
    [currentStore, currentUser]
  );

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [estado, setEstado] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [bairroId, setBairroId] = useState("");
  const [cidadeNome, setCidadeNome] = useState("");
  const [bairroNome, setBairroNome] = useState("");

  const [cidades, setCidades] = useState([]);
  const [bairros, setBairros] = useState([]);

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingBairros, setLoadingBairros] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function preencherEndereco(origem = {}) {
    setRua(origem.endereco || origem.rua || "");
    setNumero(origem.numero || origem.numero_endereco || "");
    setComplemento(origem.complemento || "");
    setEstado(origem.estado || "");
    setCidadeId(origem.cidade_id ? String(origem.cidade_id) : "");
    setBairroId(origem.bairro_id ? String(origem.bairro_id) : "");
    setCidadeNome(origem.cidade || "");
    setBairroNome(origem.bairro || "");
  }

  function salvarCacheLocal(dados) {
    const atual = JSON.parse(localStorage.getItem(perfilStorageKey) || "{}");
    const atualizado = { ...atual, ...dados };

    localStorage.setItem(perfilStorageKey, JSON.stringify(atualizado));
    localStorage.setItem("perfil", JSON.stringify(atualizado));
    emitProfileChanged();
  }

  async function carregarDados() {
    setErro("");
    setLoadingInicial(true);

    try {
      const dadosLocal =
        JSON.parse(localStorage.getItem(perfilStorageKey) || "null") ||
        JSON.parse(localStorage.getItem("perfil") || "null");

      if (dadosLocal) {
        preencherEndereco(dadosLocal);
      }

      if (currentStore) {
        const { data } = await api.get("/empresa/me");
        preencherEndereco(data || {});
        salvarCacheLocal({
          nome: data?.nome_empresa,
          telefone: data?.telefone,
          estado: data?.estado,
          cidade_id: data?.cidade_id,
          cidade: data?.cidade,
          bairro_id: data?.bairro_id,
          bairro: data?.bairro,
          endereco: data?.endereco,
          numero: data?.numero,
          numero_endereco: data?.numero,
          complemento: data?.complemento,
        });
      } else if (currentUser) {
        const { data } = await api.get("/usuario/me");
        preencherEndereco({
          ...data,
          numero: data?.numero,
          numero_endereco: data?.numero_endereco,
        });

        salvarCacheLocal({
          nome: data?.nome,
          telefone: data?.numero,
          estado: data?.estado,
          cidade_id: data?.cidade_id,
          cidade: data?.cidade,
          bairro_id: data?.bairro_id,
          bairro: data?.bairro,
          endereco: data?.endereco,
          numero: data?.numero_endereco,
          numero_endereco: data?.numero_endereco,
          complemento: data?.complemento,
        });
      }
    } catch (e) {
      console.error("Erro ao carregar endereco:", e);
    } finally {
      setLoadingInicial(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!estado) {
      setCidades([]);
      setCidadeId("");
      setCidadeNome("");
      return;
    }

    setLoadingCidades(true);
    api
      .get(`/cidade?uf=${estado}`)
      .then((res) => {
        const lista = res.data || [];
        setCidades(lista);

        if (cidadeId) {
          const selecionada = lista.find((c) => String(c.id) === String(cidadeId));
          if (selecionada) setCidadeNome(selecionada.nome);
        }
      })
      .catch(() => {
        setCidades([]);
        setErro("Nao foi possivel carregar as cidades.");
      })
      .finally(() => setLoadingCidades(false));
  }, [estado]);

  useEffect(() => {
    if (!cidadeId) {
      setBairros([]);
      setBairroId("");
      setBairroNome("");
      return;
    }

    setLoadingBairros(true);
    api
      .get(`/bairro?cidade_id=${cidadeId}`)
      .then((res) => {
        const lista = res.data || [];
        setBairros(lista);

        if (bairroId) {
          const selecionado = lista.find((b) => String(b.id) === String(bairroId));
          if (selecionado) setBairroNome(selecionado.nome);
        }
      })
      .catch(() => {
        setBairros([]);
        setErro("Nao foi possivel carregar os bairros.");
      })
      .finally(() => setLoadingBairros(false));
  }, [cidadeId]);

  async function salvarEndereco() {
    setErro("");
    setSucesso("");

    const cidadeSelecionada = cidades.find((c) => String(c.id) === String(cidadeId));
    const bairroSelecionado = bairros.find((b) => String(b.id) === String(bairroId));

    if (!estado || !cidadeSelecionada || !bairroSelecionado || !rua || !numero) {
      setErro("Preencha estado, cidade, bairro, rua e numero.");
      return;
    }

    const payloadLocal = {
      estado,
      cidade_id: cidadeSelecionada.id,
      cidade: cidadeSelecionada.nome,
      bairro_id: bairroSelecionado.id,
      bairro: bairroSelecionado.nome,
      endereco: rua,
      numero,
      numero_endereco: numero,
      complemento,
    };

    salvarCacheLocal(payloadLocal);
    setSalvando(true);

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const token = auth.access_token || localStorage.getItem("token");

      if (currentStore) {
        const { data } = await api.put("/empresa/me", {
          estado,
          cidade_id: cidadeSelecionada.id,
          bairro_id: bairroSelecionado.id,
          endereco: rua,
          numero,
          complemento,
        });

        saveAuth({
          ...auth,
          empresa: {
            ...currentStore,
            ...data,
            estado: data?.estado ?? estado,
            cidade_id: data?.cidade_id ?? cidadeSelecionada.id,
            cidade: data?.cidade ?? cidadeSelecionada.nome,
            bairro_id: data?.bairro_id ?? bairroSelecionado.id,
            bairro: data?.bairro ?? bairroSelecionado.nome,
            endereco: data?.endereco ?? rua,
            numero: data?.numero ?? numero,
            complemento: data?.complemento ?? complemento,
          },
          access_token: token,
        });
      } else if (currentUser) {
        const { data } = await api.put("/usuario/me", {
          estado,
          cidade_id: cidadeSelecionada.id,
          bairro_id: bairroSelecionado.id,
          endereco: rua,
          numero_endereco: numero,
          complemento,
        });

        saveAuth({
          ...auth,
          usuario: {
            ...currentUser,
            ...data,
            estado: data?.estado ?? estado,
            cidade_id: data?.cidade_id ?? cidadeSelecionada.id,
            cidade: data?.cidade ?? cidadeSelecionada.nome,
            bairro_id: data?.bairro_id ?? bairroSelecionado.id,
            bairro: data?.bairro ?? bairroSelecionado.nome,
            endereco: data?.endereco ?? rua,
            numero: data?.numero_endereco ?? numero,
            numero_endereco: data?.numero_endereco ?? numero,
            complemento: data?.complemento ?? complemento,
          },
          access_token: token,
        });
      }

      salvarCacheLocal(payloadLocal);
      setSucesso("Endereco salvo com sucesso.");
      setTimeout(() => navigate(-1), 700);
    } catch (e) {
      console.error("Erro ao salvar endereco:", e);
      setSucesso("Salvo localmente. O banco nao respondeu agora.");
    } finally {
      setSalvando(false);
    }
  }

  const cardClass =
    "theme-glass rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.18)]";
  const inputClass =
    "theme-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-theme focus:ring-2 focus:ring-blue-400/20";
  const labelClass =
    "theme-muted mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em]";

  return (
    <div className="theme-page pb-36">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="theme-muted mb-4 inline-flex items-center gap-2 text-sm transition hover:text-theme-primary"
          >
            <span className="material-icons text-lg">arrow_back</span>
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <div className="theme-glass flex h-14 w-14 items-center justify-center rounded-3xl">
              <span className="material-icons text-2xl text-theme-accent">location_on</span>
            </div>

            <div>
              <h1 className="theme-title text-2xl font-bold">Endereco</h1>
              <p className="theme-muted text-sm">
                Escolha seu endereco.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5">
        <div className={`${cardClass} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="theme-title text-base font-semibold">Local de entrega</h2>
              <p className="theme-muted text-sm">
                Estado, cidade, bairro, rua e complemento.
              </p>
            </div>

            {loadingInicial && (
              <span className="text-xs text-theme-accent">Carregando...</span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Estado</label>
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setCidadeId("");
                  setBairroId("");
                  setCidadeNome("");
                  setBairroNome("");
                }}
                className={inputClass}
              >
                <option value="">Selecione o estado</option>
                {ESTADOS.map((item) => (
                  <option key={item.uf} value={item.uf}>
                    {item.nome} ({item.uf})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Cidade</label>
              <select
                value={cidadeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCidadeId(id);
                  setBairroId("");
                  setBairroNome("");
                  const selecionada = cidades.find((c) => String(c.id) === String(id));
                  setCidadeNome(selecionada?.nome || "");
                }}
                disabled={!estado || loadingCidades}
                className={inputClass}
              >
                <option value="">
                  {loadingCidades ? "Carregando cidades..." : "Selecione a cidade"}
                </option>
                {cidades.map((cidade) => (
                  <option key={cidade.id} value={cidade.id}>
                    {cidade.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Bairro</label>
              <select
                value={bairroId}
                onChange={(e) => {
                  const id = e.target.value;
                  setBairroId(id);
                  const selecionado = bairros.find((b) => String(b.id) === String(id));
                  setBairroNome(selecionado?.nome || "");
                }}
                disabled={!cidadeId || loadingBairros}
                className={inputClass}
              >
                <option value="">
                  {loadingBairros ? "Carregando bairros..." : "Selecione o bairro"}
                </option>
                {bairros.map((bairro) => (
                  <option key={bairro.id} value={bairro.id}>
                    {bairro.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Rua</label>
              <input
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                className={inputClass}
                placeholder="Nome da rua"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Numero</label>
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={inputClass}
                  placeholder="123"
                />
              </div>

              <div>
                <label className={labelClass}>Complemento</label>
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={inputClass}
                  placeholder="Casa, apto, bloco..."
                />
              </div>
            </div>
          </div>
        </div>

        {(cidadeNome || bairroNome || rua) && (
          <div className={`${cardClass} p-5`}>
            <h3 className="theme-muted mb-3 text-sm font-semibold uppercase tracking-[0.18em]">
              Pre-visualizacao
            </h3>

            <div className="theme-section rounded-2xl p-4">
              <p className="theme-title font-semibold">
                {rua || "Rua nao informada"}
                {numero ? `, ${numero}` : ""}
              </p>
              <p className="theme-muted mt-1 text-sm">
                {[bairroNome, cidadeNome, estado].filter(Boolean).join(" • ")}
              </p>
              {complemento && (
                <p className="mt-2 text-sm text-theme-accent">{complemento}</p>
              )}
            </div>
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {sucesso}
          </div>
        )}
      </div>

      <div className="theme-surface fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl">
        <div className="mx-auto max-w-3xl p-4">
          <button
            onClick={salvarEndereco}
            disabled={salvando}
            className="theme-button-primary w-full rounded-2xl py-4 text-base font-bold transition hover:brightness-110 disabled:opacity-70"
          >
            {salvando ? "Salvando..." : "Salvar endereco"}
          </button>
        </div>
      </div>
    </div>
  );
}