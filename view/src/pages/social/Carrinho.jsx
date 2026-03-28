import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../core/api";
import { CarrinhoContext } from "../../context/CarrinhoContext";
import { getCurrentUser } from "../../utils/auth";

function getPerfilKey() {
  const usuario = getCurrentUser();
  return usuario ? `perfil_usuario_${usuario.id}` : "perfil";
}

export default function Carrinho() {
  const navigate = useNavigate();
  const { carrinho, aumentar, diminuir, remover, limpar } = useContext(CarrinhoContext);
  const perfilKey = useMemo(() => getPerfilKey(), []);
  const [endereco, setEndereco] = useState("");
  const [perfilEntrega, setPerfilEntrega] = useState(null);

  useEffect(() => {
    const perfil = JSON.parse(localStorage.getItem(perfilKey) || localStorage.getItem("perfil") || "{}");
    const parts = [
      perfil.endereco,
      perfil.numero,
      perfil.bairro,
      perfil.cidade && perfil.estado ? `${perfil.cidade}/${perfil.estado}` : perfil.cidade,
    ].filter(Boolean);
    setPerfilEntrega(perfil);
    setEndereco(parts.join(", "));
  }, [perfilKey]);

  const total = carrinho.reduce((acc, item) => acc + Number(item.preco) * item.qtd, 0);

  async function finalizarPedido() {
    const usuario = getCurrentUser();
    if (!usuario) {
      navigate("/login");
      return;
    }
    const empresaId = carrinho[0]?.id_empresa;
    if (!empresaId) return;
    if (!perfilEntrega?.endereco || !perfilEntrega?.numero || !perfilEntrega?.bairro || !perfilEntrega?.cidade || !perfilEntrega?.estado) {
      alert("Defina o endereço completo antes de finalizar.");
      navigate("/endereco");
      return;
    }

    try {
      await api.post("/pedido/", {
        id_empresa: empresaId,
        id_usuario: usuario.id,
        endereco: {
          rua: perfilEntrega.endereco,
          numero: perfilEntrega.numero,
          complemento: perfilEntrega.complemento || "",
          bairro: perfilEntrega.bairro,
          cidade: perfilEntrega.cidade,
          estado: perfilEntrega.estado,
        },
        itens: carrinho.map((item) => ({
          id_item: item.id,
          quantidade: item.qtd,
          preco: Number(item.preco),
          observacao: item.obs || null,
          tamanho: item.tamanho || null,
          sabores: item.sabores || [],
        })),
      });
      limpar();
      navigate("/meuspedidos");
    } catch (error) {
      alert(error?.response?.data?.detail || "Erro ao finalizar pedido.");
    }
  }

  if (!carrinho.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 px-8">
        <span className="material-icons text-7xl mb-4 text-gray-200">shopping_bag</span>
        <h2 className="text-lg font-bold text-gray-600 mb-1">Carrinho vazio</h2>
        <p className="text-sm text-center text-gray-400 mb-6">Adicione itens do cardápio para continuar</p>
        <button onClick={() => navigate("/")} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-semibold">Ver restaurantes</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 mb-2"><span className="material-icons text-xl">arrow_back</span><span className="text-sm">Voltar</span></button>
        <h1 className="font-bold text-xl text-gray-900">Meu pedido</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
        {carrinho.map((item) => (
          <div key={item.linhaKey} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{item.nome}</h3>
                {item.tamanho && <p className="text-xs text-gray-500 mt-0.5">Tamanho: {item.tamanho}</p>}
                {item.sabores?.length > 0 && <p className="text-xs text-gray-500 mt-0.5">Sabores: {item.sabores.join(", ")}</p>}
                {item.obs && <p className="text-xs text-gray-400 mt-0.5">Obs: {item.obs}</p>}
                <p className="text-xs text-gray-400 mt-0.5">R$ {Number(item.preco).toFixed(2)} un.</p>
              </div>
              <button onClick={() => remover(item.linhaKey)} className="text-gray-300 hover:text-red-400 ml-3 flex-shrink-0"><span className="material-icons text-xl">delete_outline</span></button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                <button onClick={() => diminuir(item.linhaKey)} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-gray-600">−</button>
                <span className="text-sm font-bold w-5 text-center">{item.qtd}</span>
                <button onClick={() => aumentar(item.linhaKey)} className="w-8 h-8 bg-red-500 rounded-lg text-white flex items-center justify-center font-bold">+</button>
              </div>
              <span className="font-bold text-red-500">R$ {(Number(item.preco) * item.qtd).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 space-y-3">
        <button onClick={() => navigate("/endereco")} className="w-full flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-left">
          <span className="material-icons text-red-500 flex-shrink-0">location_on</span>
          <div className="flex-1 min-w-0"><p className="text-xs text-gray-400">Entregar em</p><p className="text-sm font-semibold text-gray-800 truncate">{endereco || "Defina seu endereço"}</p></div>
        </button>
        <div className="flex justify-between items-center px-1"><span className="text-gray-600 font-medium">Total</span><span className="font-bold text-xl text-red-500">R$ {total.toFixed(2)}</span></div>
        <button className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base" onClick={finalizarPedido}>Finalizar pedido</button>
        <button className="w-full text-gray-400 text-sm py-1" onClick={limpar}>Limpar carrinho</button>
      </div>
    </div>
  );
}
