import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listarPublicacoes } from "../../services/publicacoesService";
import PostCard from "../../components/posts/PostCard";

export default function PerfilUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarPublicacoes()
      .then((data) => setPosts(data))
      .finally(() => setLoading(false));
  }, []);

  const usuarioPosts = useMemo(() => posts.filter((item) => String(item.id_usuario) === String(id)), [posts, id]);
  const usuario = usuarioPosts[0];

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-icons text-gray-700">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Perfil do usuário</h1>
            <p className="text-xs text-gray-400">Publicações, gostos e histórico social</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-3xl font-bold">
              {usuario?.usuario_nome?.slice(0, 1) || "U"}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{usuario?.usuario_nome || "Usuário"}</h2>
              <p className="text-sm text-gray-500">Apaixonado por delivery, descobertas e bons pedidos.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <p className="text-lg font-black text-gray-900">{usuarioPosts.length}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <p className="text-lg font-black text-gray-900">{new Set(usuarioPosts.map((item) => item.id_empresa)).size}</p>
              <p className="text-xs text-gray-400">Lojas</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <p className="text-lg font-black text-gray-900">4.9</p>
              <p className="text-xs text-gray-400">Avaliação</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Publicações</h3>
            <span className="text-xs text-gray-400">Feed do usuário</span>
          </div>

          {loading && <div className="text-sm text-gray-400">Carregando posts...</div>}
          {!loading && !usuarioPosts.length && <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center text-gray-400">Nenhuma publicação encontrada.</div>}
          {!loading && usuarioPosts.map((post) => <PostCard key={post.id} post={post} />)}
        </section>
      </div>
    </div>
  );
}
