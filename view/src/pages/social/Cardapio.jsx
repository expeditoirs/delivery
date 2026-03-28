import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";

import api from "../../core/api";
import { CarrinhoContext } from "../../context/CarrinhoContext";
import { ItemCardSkeleton } from "../../components/Skeleton";

export default function FinalCardapio() {
  const { empresa_id } = useParams();
  const navigate = useNavigate();
  const { adicionar } = useContext(CarrinhoContext);

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    api.get(`/empresa/${empresa_id}/cardapio`)
      .then(res => setCategorias(res.data.categorias || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [empresa_id]);

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
      <div className="px-4 pt-4 pb-24 space-y-6">
        <div className="h-6 bg-gray-200 animate-pulse rounded-full w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <ItemCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!categorias.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="material-icons text-5xl mb-3">menu_book</span>
        <p className="text-sm font-medium">Cardápio não disponível</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 mb-3">
          <span className="material-icons text-xl">arrow_back</span>
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
      </div>

      <div className="space-y-7 px-4">
        {categorias.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{cat.nome}</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-3">
              {cat.itens.map(item => (
                <div
                  key={item.id}
                  onClick={() => item.id && navigate(`/produto/${item.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{item.nome}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.descricao}</p>
                    <p className="text-red-500 font-bold text-sm mt-1.5">R$ {Number(item.preco).toFixed(2)}</p>
                    {(item.tipo_produto === "pizza" || item.tipo_produto === "acai") && <p className="text-[11px] text-gray-400 mt-1">Produto configurável</p>}
                  </div>

                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex items-center justify-center">
                      <span className="material-icons text-orange-300 text-2xl">fastfood</span>
                    </div>
                    <button
                      onClick={e => handleAdicionar(e, item)}
                      className={`min-w-8 h-8 px-2 rounded-full flex items-center justify-center text-white font-bold transition-colors active:scale-90 ${addedId === item.id ? "bg-green-500" : "bg-red-500"}`}
                    >
                      {item.tipo_produto === "pizza" || item.tipo_produto === "acai"
                        ? <span className="material-icons text-sm">tune</span>
                        : addedId === item.id
                          ? <span className="material-icons text-sm">check</span>
                          : <span className="text-lg leading-none">+</span>}
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
