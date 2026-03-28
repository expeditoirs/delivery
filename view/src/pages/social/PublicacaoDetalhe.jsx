import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarPublicacaoPorId } from "../../services/publicacoesService";
import { listarComentarios, adicionarComentario } from "../../services/comentariosService";
import { alternarCurtida, obterCurtida, obterQuantidadeCurtidas } from "../../services/curtidasService";
import CommentForm from "../../components/posts/CommentForm";
import CommentList from "../../components/posts/CommentList";
import PostActions from "../../components/posts/PostActions";
import { getCurrentStore, getCurrentUser } from "../../utils/auth";

const visualByType = {
  pizza: { icon: "local_pizza", bg: "from-orange-50 via-red-50 to-yellow-50", color: "text-orange-300" },
  burger: { icon: "lunch_dining", bg: "from-amber-50 via-orange-50 to-red-50", color: "text-amber-400" },
  acai: { icon: "icecream", bg: "from-fuchsia-50 via-pink-50 to-purple-50", color: "text-fuchsia-300" },
};

export default function PublicacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = getCurrentUser();
  const loja = getCurrentStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentarios, setComentarios] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const encontrado = await buscarPublicacaoPorId(id);
      setPost(encontrado);
      setComentarios(listarComentarios(id));
      setLiked(obterCurtida(id));
      setLikesCount(obterQuantidadeCurtidas(id) || Math.floor(((encontrado?.total_pedido || 20) * 2.4)));
      setLoading(false);
    }

    carregar();
  }, [id]);

  const visual = useMemo(() => visualByType[post?.imagem_url] || { icon: "photo", bg: "from-gray-50 to-gray-100", color: "text-gray-300" }, [post?.imagem_url]);

  function handleCurtir() {
    const result = alternarCurtida(id, likesCount);
    setLiked(result.liked);
    setLikesCount(result.count);
  }

  function handleComentar(texto) {
    const nome = usuario?.nome || loja?.nome_empresa || "Visitante";
    const atualizados = adicionarComentario(id, { usuario_nome: nome, texto });
    setComentarios(atualizados);
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-400">Carregando publicação...</div>;
  }

  if (!post) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 mb-4">
          <span className="material-icons text-xl">arrow_back</span>
          <span className="text-sm">Voltar</span>
        </button>
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-400">
          Publicação não encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-icons text-gray-700">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Publicação</h1>
            <p className="text-xs text-gray-400">Experiência compartilhada pela comunidade</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <article className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)} className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold">
                {post.usuario_nome?.slice(0, 1) || "U"}
              </button>
              <div className="min-w-0">
                <button onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)} className="text-sm font-bold text-gray-900 truncate block">
                  {post.usuario_nome}
                </button>
                <button onClick={() => navigate(`/perfil/loja/${post.id_empresa}`)} className="text-xs text-gray-500 truncate">
                  {post.empresa_nome}
                </button>
              </div>
            </div>
            <span className="text-xs text-gray-400">{new Date(post.criado_em).toLocaleDateString("pt-BR")}</span>
          </div>

          <div className={`mx-4 mb-4 h-80 rounded-[24px] bg-gradient-to-br ${visual.bg} flex items-center justify-center border border-white/60`}>
            <span className={`material-icons text-[108px] ${visual.color}`}>{visual.icon}</span>
          </div>

          <div className="px-4 pb-5">
            <PostActions
              liked={liked}
              likesCount={likesCount}
              commentsCount={comentarios.length}
              onToggleLike={handleCurtir}
              onOpenComments={() => {}}
            />
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-bold">{post.usuario_nome}</span> {post.descricao}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Pedido</p>
                <p className="text-lg font-black text-gray-900 mt-1">R$ {Number(post.total_pedido || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Loja</p>
                <p className="text-lg font-black text-gray-900 mt-1 truncate">{post.empresa_nome}</p>
              </div>
            </div>
          </div>
        </article>

        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Comentários</h2>
            <p className="text-xs text-gray-400">Conversa, avaliação e reação da comunidade</p>
          </div>
          <CommentForm onSubmit={handleComentar} />
          <CommentList comentarios={comentarios} />
        </section>
      </div>
    </div>
  );
}
