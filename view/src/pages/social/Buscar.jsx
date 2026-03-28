import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../core/api";
import { getCache, setCache } from "../../utils/browserCache";

export default function Buscar() {
  const [busca, setBusca] = useState("");
  const [empresas, setEmpresas] = useState([]);
  const [itens, setItens] = useState([]);
  const [historico, setHistorico] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setHistorico(JSON.parse(localStorage.getItem("historicoBusca") || "[]"));
    const cached = getCache("buscar-base");
    if (cached) {
      setEmpresas(cached.empresas || []);
      setItens(cached.itens || []);
    }

    Promise.all([api.get("/empresa/"), api.get("/item/")])
      .then(([empresasRes, itensRes]) => {
        const payload = {
          empresas: empresasRes.data || [],
          itens: itensRes.data || [],
        };
        setEmpresas(payload.empresas);
        setItens(payload.itens);
        setCache("buscar-base", payload, 60_000);
      })
      .catch(console.error);
  }, []);

  function salvarHistorico(texto) {
    if (!texto) return;
    const novo = [texto, ...historico.filter((item) => item !== texto)].slice(0, 5);
    setHistorico(novo);
    localStorage.setItem("historicoBusca", JSON.stringify(novo));
  }

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return { empresas: [], itens: [] };
    return {
      empresas: empresas.filter((empresa) => (empresa.nome_empresa || "").toLowerCase().includes(termo)),
      itens: itens.filter((item) => (item.nome || "").toLowerCase().includes(termo) || (item.descricao || "").toLowerCase().includes(termo)),
    };
  }, [busca, empresas, itens]);

  useEffect(() => {
    if (busca.trim()) salvarHistorico(busca.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
          <span className="material-icons text-gray-400 text-xl">search</span>
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar restaurantes ou pratos" className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400" />
        </div>
      </div>

      <div className="p-4 space-y-5">
        {!busca && historico.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Buscas recentes</h2>
            <div className="flex flex-wrap gap-2">{historico.map((h, i) => <button key={i} onClick={() => setBusca(h)} className="bg-white px-3 py-2 rounded-xl text-sm text-gray-600 border border-gray-100 shadow-sm">{h}</button>)}</div>
          </div>
        )}

        {!busca && !historico.length && <div className="flex flex-col items-center py-14 text-gray-400"><span className="material-icons text-6xl mb-3 text-gray-200">search</span><p className="font-medium text-gray-500">Busque restaurantes e pratos</p></div>}

        {!!busca && !resultados.empresas.length && !resultados.itens.length && <div className="flex flex-col items-center py-14 text-gray-400"><span className="material-icons text-5xl mb-3">search_off</span><p>Nenhum resultado</p></div>}

        {!!resultados.empresas.length && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Restaurantes</h2>
            <div className="space-y-2">{resultados.empresas.map((empresa) => <button key={empresa.id} onClick={() => navigate(`/cardapio/${empresa.id}`)} className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><span className="material-icons text-red-400">restaurant</span></div><div><p className="font-semibold text-sm text-gray-900">{empresa.nome_empresa}</p><p className="text-xs text-gray-400">{empresa.categoria_empresa || "Restaurante"}</p></div></button>)}</div>
          </div>
        )}

        {!!resultados.itens.length && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Pratos</h2>
            <div className="space-y-2">{resultados.itens.map((item) => <button key={item.id} onClick={() => navigate(`/produto/${item.id}`)} className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center"><span className="material-icons text-orange-400">fastfood</span></div><div className="min-w-0"><p className="font-semibold text-sm text-gray-900 truncate">{item.nome}</p><p className="text-xs text-gray-400 truncate">{item.descricao}</p></div><span className="ml-auto text-sm font-bold text-red-500">R$ {Number(item.preco).toFixed(2)}</span></button>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
