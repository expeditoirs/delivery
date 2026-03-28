import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../core/api";
import { listarPublicacoes } from "../../services/publicacoesService";

export default function PerfilLoja() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [empresasRes, publicacoes] = await Promise.all([api.get("/empresa/"), listarPublicacoes()]);
        const listaEmpresas = Array.isArray(empresasRes.data) ? empresasRes.data : [];
        setEmpresa(listaEmpresas.find((item) => String(item.id) === String(id)) || null);
        setPosts(publicacoes);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  const postsDaLoja = useMemo(() => posts.filter((item) => String(item.id_empresa) === String(id)), [posts, id]);

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-icons text-gray-700">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Perfil da loja</h1>
            <p className="text-xs text-gray-400">Marca, cardápio e prova social</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <section className="bg-gradient-to-br from-gray-950 via-red-950 to-orange-900 rounded-[32px] p-5 text-white shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
            <span className="material-icons text-4xl">storefront</span>
          </div>
          <h2 className="text-2xl font-black">{empresa?.nome_empresa || "Loja"}</h2>
          <p className="text-sm text-white/80 mt-1">{empresa?.categoria_empresa || "Especialidade da casa"}</p>
          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-lg font-black">4.9</p>
              <p className="text-[11px] text-white/70">Nota</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-lg font-black">{postsDaLoja.length}</p>
              <p className="text-[11px] text-white/70">Posts</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-lg font-black">25-35m</p>
              <p className="text-[11px] text-white/70">Entrega</p>
            </div>
          </div>
          <button onClick={() => navigate(`/cardapio/${id}`)} className="mt-5 w-full bg-white text-red-500 py-3.5 rounded-2xl font-bold">
            Ver cardápio
          </button>
        </section>

        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Prova social da loja</h3>
            <span className="text-xs text-gray-400">Publicações reais</span>
          </div>

          {loading && <div className="text-sm text-gray-400">Carregando...</div>}
          {!loading && !postsDaLoja.length && <div className="text-sm text-gray-400">Ainda não há posts aprovados para esta loja.</div>}

          <div className="space-y-3">
            {postsDaLoja.map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/publicacao/${post.id}`)}
                className="w-full text-left rounded-3xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{post.usuario_nome}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.descricao}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500">R$ {Number(post.total_pedido || 0).toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
