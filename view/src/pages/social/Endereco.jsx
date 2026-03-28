import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../core/api";
import { getCurrentUser } from "../../utils/auth";

const ESTADOS = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "PR", nome: "Paraná" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "TO", nome: "Tocantins" },
];

function getPerfilKey() {
  const user = getCurrentUser();
  return user ? `perfil_usuario_${user.id}` : "perfil";
}

export default function FinalEndereco() {
  const navigate = useNavigate();
  const perfilKey = useMemo(() => getPerfilKey(), []);

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [estado, setEstado] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [bairroId, setBairroId] = useState("");
  const [cidades, setCidades] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingBairros, setLoadingBairros] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const perfil = JSON.parse(localStorage.getItem(perfilKey) || localStorage.getItem("perfil") || "{}");
    setRua(perfil.endereco || "");
    setNumero(perfil.numero || "");
    setComplemento(perfil.complemento || "");
    setEstado(perfil.estado || "");
    setCidadeId(perfil.cidade_id ? String(perfil.cidade_id) : "");
    setBairroId(perfil.bairro_id ? String(perfil.bairro_id) : "");
  }, [perfilKey]);

  useEffect(() => {
    if (!estado) {
      setCidades([]);
      setCidadeId("");
      return;
    }

    setLoadingCidades(true);
    api.get(`/cidade?uf=${estado}`)
      .then((res) => setCidades(res.data || []))
      .catch(() => {
        setCidades([]);
        setErro("Não foi possível carregar as cidades.");
      })
      .finally(() => setLoadingCidades(false));
  }, [estado]);

  useEffect(() => {
    if (!cidadeId) {
      setBairros([]);
      setBairroId("");
      return;
    }

    setLoadingBairros(true);
    api.get(`/bairro?cidade_id=${cidadeId}`)
      .then((res) => setBairros(res.data || []))
      .catch(() => {
        setBairros([]);
        setErro("Não foi possível carregar os bairros.");
      })
      .finally(() => setLoadingBairros(false));
  }, [cidadeId]);

  function salvarEndereco() {
    setErro("");
    const cidadeSelecionada = cidades.find((c) => String(c.id) === String(cidadeId));
    const bairroSelecionado = bairros.find((b) => String(b.id) === String(bairroId));

    if (!estado || !cidadeSelecionada || !bairroSelecionado || !rua || !numero) {
      setErro("Preencha estado, cidade, bairro, rua e número.");
      return;
    }

    const perfilAtual = JSON.parse(localStorage.getItem(perfilKey) || localStorage.getItem("perfil") || "{}");
    const atualizado = {
      ...perfilAtual,
      estado,
      cidade_id: cidadeSelecionada.id,
      cidade: cidadeSelecionada.nome,
      bairro_id: bairroSelecionado.id,
      bairro: bairroSelecionado.nome,
      endereco: rua,
      numero,
      complemento,
    };

    localStorage.setItem(perfilKey, JSON.stringify(atualizado));
    localStorage.setItem("perfil", JSON.stringify(atualizado));
    navigate(-1);
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-white";
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

  return (
    <div className="bg-gray-50 min-h-full pb-36">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 mb-3">
          <span className="material-icons text-xl">arrow_back</span>
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
            <span className="material-icons text-red-400">location_on</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Endereço de entrega</h1>
            <p className="text-xs text-gray-400">Rua e número digitados, localização vinda do cadastro da plataforma</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className={labelClass}>Estado</label>
            <select value={estado} onChange={(e) => { setEstado(e.target.value); setCidadeId(""); setBairroId(""); }} className={inputClass}>
              <option value="">Selecione o estado</option>
              {ESTADOS.map((uf) => <option key={uf.uf} value={uf.uf}>{uf.nome} ({uf.uf})</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Cidade</label>
            <select value={cidadeId} onChange={(e) => { setCidadeId(e.target.value); setBairroId(""); }} disabled={!estado || loadingCidades} className={inputClass}>
              <option value="">{loadingCidades ? "Carregando cidades..." : "Selecione a cidade"}</option>
              {cidades.map((cidade) => <option key={cidade.id} value={cidade.id}>{cidade.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Bairro</label>
            <select value={bairroId} onChange={(e) => setBairroId(e.target.value)} disabled={!cidadeId || loadingBairros} className={inputClass}>
              <option value="">{loadingBairros ? "Carregando bairros..." : "Selecione o bairro"}</option>
              {bairros.map((bairro) => <option key={bairro.id} value={bairro.id}>{bairro.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Rua</label>
            <input value={rua} onChange={e => setRua(e.target.value)} className={inputClass} placeholder="Nome da rua" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Número</label>
              <input value={numero} onChange={e => setNumero(e.target.value)} className={inputClass} placeholder="123" />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Complemento</label>
              <input value={complemento} onChange={e => setComplemento(e.target.value)} className={inputClass} placeholder="Casa, apto..." />
            </div>
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button onClick={salvarEndereco} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform">
          Salvar endereço
        </button>
      </div>
    </div>
  );
}
