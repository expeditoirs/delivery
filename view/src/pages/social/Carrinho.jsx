import { useContext, useMemo } from "react";
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
  const perfilEntrega = useMemo(() => {
    const perfil = JSON.parse(localStorage.getItem(perfilKey) || localStorage.getItem("perfil") || "{}");
    return perfil;
  }, [perfilKey]);

  const endereco = useMemo(() => {
    return [
      perfilEntrega?.endereco,
      perfilEntrega?.numero,
      perfilEntrega?.bairro,
      perfilEntrega?.cidade && perfilEntrega?.estado ? `${perfilEntrega.cidade}/${perfilEntrega.estado}` : perfilEntrega?.cidade,
    ].filter(Boolean).join(", ");
  }, [perfilEntrega]);

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
          complementos: {
            adicionais: item.adicionais || [],
            grupos: item.grupos || [],
          },
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
    <div className="flex flex-col items-center justify-center h-full py-20 px-8 bg-theme-background text-theme-muted">
      <span className="material-icons text-7xl mb-4 text-theme-secondary/60">
        shopping_bag
      </span>
      <h2 className="text-lg font-bold text-theme-text mb-1">
        Carrinho vazio
      </h2>
      <p className="text-sm text-center text-theme-muted mb-6">
        Adicione itens do cardápio para continuar
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-theme-primary text-white px-6 py-3 rounded-2xl font-semibold hover:bg-theme-accent transition-colors"
      >
        Ver restaurantes
      </button>
    </div>
  );
}

return (
  <div className="flex flex-col h-[100dvh] bg-theme-background">
    <div className="bg-theme-surface px-4 pt-4 pb-3 border-b border-theme-border flex-shrink-0">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-theme-muted mb-2 hover:text-theme-text transition-colors"
      >
        <span className="material-icons text-xl">arrow_back</span>
        <span className="text-sm">Voltar</span>
      </button>

      <h1 className="font-bold text-xl text-theme-text">Meu pedido</h1>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
      {carrinho.map((item) => (
        <div
          key={item.linhaKey}
          className="bg-theme-surface rounded-2xl p-4 border border-theme-border shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-theme-text truncate">
                {item.nome}
              </h3>

              {item.tamanho && (
                <p className="text-xs text-theme-muted mt-0.5">
                  Tamanho: {item.tamanho}
                </p>
              )}

              {item.sabores?.length > 0 && (
                <p className="text-xs text-theme-muted mt-0.5">
                  Sabores: {item.sabores.join(", ")}
                </p>
              )}

              {item.adicionais?.length > 0 && (
                <p className="text-xs text-theme-muted mt-0.5">
                  Adicionais: {item.adicionais.map((extra) => `${extra.nome}${extra.quantidade > 1 ? ` x${extra.quantidade}` : ""}`).join(", ")}
                </p>
              )}

              {item.grupos?.length > 0 && item.grupos.map((grupo) => (
                <p key={grupo.grupo_nome} className="text-xs text-theme-muted mt-0.5">
                  {grupo.grupo_nome}: {(grupo.itens || []).map((opcao) => opcao.nome).join(", ")}
                </p>
              ))}

              {item.obs && (
                <p className="text-xs text-theme-muted mt-0.5">
                  Obs: {item.obs}
                </p>
              )}

              <p className="text-xs text-theme-muted mt-0.5">
                R$ {Number(item.preco).toFixed(2)} un.
              </p>
            </div>

            <button
              onClick={() => remover(item.linhaKey)}
              className="text-theme-muted hover:text-theme-accent ml-3 flex-shrink-0 transition-colors"
            >
              <span className="material-icons text-xl">delete_outline</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-theme-hover rounded-xl p-1 border border-theme-border">
              <button
                onClick={() => diminuir(item.linhaKey)}
                className="w-8 h-8 bg-theme-surface rounded-lg border border-theme-border flex items-center justify-center font-bold text-theme-text"
              >
                −
              </button>

              <span className="text-sm font-bold w-5 text-center text-theme-text">
                {item.qtd}
              </span>

              <button
                onClick={() => aumentar(item.linhaKey)}
                className="w-8 h-8 bg-theme-primary rounded-lg text-white flex items-center justify-center font-bold hover:bg-theme-accent transition-colors"
              >
                +
              </button>
            </div>

            <span className="font-bold text-theme-primary">
              R$ {(Number(item.preco) * item.qtd).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>

    <div className="flex-shrink-0 bg-theme-surface border-t border-theme-border p-4 space-y-3">
      <button
        onClick={() => navigate("/endereco")}
        className="w-full flex items-center gap-3 bg-theme-hover p-3 rounded-xl border border-theme-border text-left"
      >
        <span className="material-icons text-theme-primary flex-shrink-0">
          location_on
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-theme-muted">Entregar em</p>
          <p className="text-sm font-semibold text-theme-text truncate">
            {endereco || "Defina seu endereço"}
          </p>
        </div>
      </button>

      <div className="flex justify-between items-center px-1">
        <span className="text-theme-muted font-medium">Total</span>
        <span className="font-bold text-xl text-theme-primary">
          R$ {total.toFixed(2)}
        </span>
      </div>

      <button
        className="w-full bg-theme-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-theme-accent transition-colors"
        onClick={finalizarPedido}
      >
        Finalizar pedido
      </button>

      <button
        className="w-full text-theme-muted text-sm py-1 hover:text-theme-text transition-colors"
        onClick={limpar}
      >
        Limpar carrinho
      </button>
    </div>
  </div>
);}
