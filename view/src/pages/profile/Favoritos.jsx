import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredFavorites, saveStoredFavorites } from "../../utils/favorites";

export default function Favoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState(() => getStoredFavorites());

  function removerFavorito(id) {
    const novos = favoritos.filter((item) => item.id !== id);
    setFavoritos(novos);
    saveStoredFavorites(novos);
  }

  function abrirItem(item) {
    if (item.tipo === "produto") {
      navigate(`/produto/${item.id}`);
    } else if (item.tipo === "loja") {
      navigate(`/loja/${item.id}`);
    } else if (item.tipo === "post") {
      navigate(`/post/${item.id}`);
    }
  }

  return (
    <div className="theme-page pb-28">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="px-4 py-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="theme-muted mb-4 flex items-center gap-2 text-sm hover:text-theme-primary"
          >
            <span className="material-icons text-lg">arrow_back</span>
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <div className="theme-glass w-14 h-14 rounded-3xl flex items-center justify-center">
              <span className="material-icons text-[#14B8A6] text-2xl">
                favorite
              </span>
            </div>

            <div>
              <h1 className="theme-title text-2xl font-bold">
                Favoritos
              </h1>
              <p className="theme-muted text-sm">
                Seus itens e lojas salvas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-3xl mx-auto space-y-3">
        {favoritos.length === 0 && (
          <div className="theme-muted text-center mt-10">
            <span className="material-icons text-5xl mb-3 block">
              favorite_border
            </span>
            Nenhum favorito ainda
          </div>
        )}

        {favoritos.map((item) => (
          <div
            key={item.id}
            className="theme-glass flex items-center gap-3 rounded-2xl p-3"
          >
            <div className="theme-icon-surface w-16 h-16 rounded-xl overflow-hidden">
              {item.imagem ? (
                <img
                  src={item.imagem}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="theme-muted w-full h-full flex items-center justify-center">
                  <span className="material-icons">image</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="theme-title font-semibold">{item.nome}</p>
              <p className="theme-muted text-xs">{item.tipo}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => abrirItem(item)}
                className="text-theme-primary"
              >
                <span className="material-icons">open_in_new</span>
              </button>

              <button
                onClick={() => removerFavorito(item.id)}
                className="text-red-400"
              >
                <span className="material-icons">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
