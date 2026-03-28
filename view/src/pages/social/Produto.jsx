import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useMemo } from "react";

import api from "../../core/api";
import { CarrinhoContext } from "../../context/CarrinhoContext";

export default function FinalProduto() {
  const { adicionar } = useContext(CarrinhoContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/item/${id}`)
      .then(res => setProduto(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const configuracao = produto?.configuracao || {};
  const tipoProduto = useMemo(() => (produto?.tipo_produto || configuracao.tipo_produto || "").toLowerCase(), [produto, configuracao]);
  const tamanhos = configuracao.tamanhos || [];
  const saboresCfg = configuracao.sabores || {};
  const saboresDisponiveis = configuracao.sabores_disponiveis || [];

  useEffect(() => {
    if (tamanhos.length && !tamanhoSelecionado) {
      setTamanhoSelecionado(tamanhos[0]);
    }
  }, [tamanhos, tamanhoSelecionado]);

  useEffect(() => {
    if (!tamanhoSelecionado && produto) {
      setTamanhoSelecionado({ nome: null, preco: Number(produto.preco) });
    }
  }, [produto, tamanhoSelecionado]);

  function toggleSabor(sabor) {
    const maxGlobal = Number(saboresCfg.max || 4);
    const maxPorTamanho = Number(tamanhoSelecionado?.max_sabores || maxGlobal);

    setSaboresSelecionados((prev) => {
      if (prev.includes(sabor)) {
        return prev.filter((item) => item !== sabor);
      }
      if (prev.length >= maxPorTamanho) {
        return prev;
      }
      return [...prev, sabor];
    });
  }

  const precoUnitario = Number(tamanhoSelecionado?.preco ?? produto?.preco ?? 0);
  const total = precoUnitario * qtd;

  function adicionarItem() {
    setErro("");
    const minSabores = Number(saboresCfg.min || 1);
    const maxSabores = Number(tamanhoSelecionado?.max_sabores || saboresCfg.max || 4);

    if ((tipoProduto === "pizza" || tipoProduto === "acai") && !tamanhoSelecionado) {
      setErro("Selecione um tamanho antes de continuar.");
      return;
    }

    if (tipoProduto === "pizza") {
      if (saboresSelecionados.length < minSabores || saboresSelecionados.length > maxSabores) {
        setErro(`Escolha entre ${minSabores} e ${maxSabores} sabores.`);
        return;
      }
    }

    adicionar({
      ...produto,
      qtd,
      obs,
      preco: precoUnitario,
      tamanho: tamanhoSelecionado?.nome || null,
      sabores: saboresSelecionados,
      empresa: produto.empresa_nome || "Empresa",
    });
    navigate(-1);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] animate-pulse">
        <div className="h-56 bg-gray-200 flex-shrink-0" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded-full w-2/3" />
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-3/4" />
          <div className="h-5 bg-gray-200 rounded-full w-1/3 mt-2" />
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="material-icons text-5xl mb-3">error_outline</span>
        <p className="text-sm font-medium">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <div className="relative flex-shrink-0">
        <div className="h-56 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
          <span className="material-icons text-orange-200 text-[96px]">fastfood</span>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center">
          <span className="material-icons text-gray-700">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{produto.nome}</h1>
          {produto.descricao && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{produto.descricao}</p>}
          <p className="text-red-500 font-bold text-2xl mt-2">R$ {precoUnitario.toFixed(2)}</p>
        </div>

        {(tipoProduto === "pizza" || tipoProduto === "acai") && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Tamanho</h2>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {tamanhos.map((tamanho) => {
                const ativo = tamanhoSelecionado?.nome === tamanho.nome;
                return (
                  <button
                    key={tamanho.nome}
                    onClick={() => setTamanhoSelecionado(tamanho)}
                    className={`border rounded-2xl px-4 py-3 text-left transition ${ativo ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{tamanho.nome}</p>
                        {tipoProduto === "pizza" && <p className="text-xs text-gray-500">Até {tamanho.max_sabores || saboresCfg.max || 4} sabores</p>}
                      </div>
                      <span className="font-bold text-red-500">R$ {Number(tamanho.preco).toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tipoProduto === "pizza" && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Sabores</h2>
            <p className="text-xs text-gray-400 mt-1">Escolha de {Number(saboresCfg.min || 1)} até {Number(tamanhoSelecionado?.max_sabores || saboresCfg.max || 4)} sabores.</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {saboresDisponiveis.map((sabor) => {
                const ativo = saboresSelecionados.includes(sabor);
                return (
                  <button key={sabor} onClick={() => toggleSabor(sabor)} className={`rounded-2xl border px-4 py-3 text-left ${ativo ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"}`}>
                    <span className="font-medium text-gray-800">{sabor}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-gray-700">Observação</label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Alguma instrução especial? Ex: sem cebola"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
          />
        </div>

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Quantidade</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setQtd(q => Math.max(1, q - 1))} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg active:scale-90 transition-transform">−</button>
            <span className="font-bold text-lg w-6 text-center">{qtd}</span>
            <button onClick={() => setQtd(q => q + 1)} className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg active:scale-90 transition-transform">+</button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
        <button onClick={adicionarItem} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform flex items-center justify-between px-5">
          <span>{qtd}x Adicionar</span>
          <span>R$ {total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
