import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarPublicacaoPorId } from "../../services/publicacoesService";
import { listarComentarios, adicionarComentario } from "../../services/comentariosService";
import { alternarCurtida, obterCurtida, obterQuantidadeCurtidas } from "../../services/curtidasService";
import CommentForm from "../../components/posts/CommentForm";
import CommentList from "../../components/posts/CommentList";
import PostActions from "../../components/posts/PostActions";
import PostMedia from '../../components/posts/PostMedia';
import { getCurrentStore, getCurrentUser } from "../../utils/auth";

const visualByType = {
  pizza: {
    icon: "local_pizza",
    bg: "from-theme-secondary via-theme-surface to-theme-background",
    color: "text-theme-accent",
  },
  burger: {
    icon: "lunch_dining",
    bg: "from-theme-primary/20 via-theme-surface to-theme-background",
    color: "text-theme-primary",
  },
  acai: {
    icon: "icecream",
    bg: "from-theme-accent/20 via-theme-surface to-theme-background",
    color: "text-theme-accent",
  },
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
      setLikesCount(
        obterQuantidadeCurtidas(id) ||
          Math.floor((encontrado?.total_pedido || 20) * 2.4)
      );
      setLoading(false);
    }

    carregar();
  }, [id]);

  const visual = useMemo(
    () =>
      visualByType[post?.imagem_url] || {
        icon: "photo",
        bg: "from-theme-secondary/40 via-theme-surface to-theme-background",
        color: "text-theme-muted",
      },
    [post?.imagem_url]
  );

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
    return (
      <div className="p-4 text-sm text-theme-muted">
        Carregando publicacao...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-theme-muted mb-4 hover:text-theme-text transition-colors"
        >
          <span className="material-icons text-xl">arrow_back</span>
          <span className="text-sm">Voltar</span>
        </button>

        <div className="bg-theme-surface rounded-3xl border border-theme-border p-8 text-center text-theme-muted">
          Publicacao nao encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-background min-h-full pb-24">
      <div className="bg-theme-surface px-4 pt-5 pb-4 border-b border-theme-border sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-theme-hover border border-theme-border flex items-center justify-center"
          >
            <span className="material-icons text-theme-text">arrow_back</span>
          </button>

          <div>
            <h1 className="text-lg font-bold text-theme-text">Publicacao</h1>
            <p className="text-xs text-theme-muted">
              Experiencia compartilhada pela comunidade
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <article className="bg-theme-surface rounded-[28px] border border-theme-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)}
                className="w-11 h-11 rounded-full bg-theme-primary/15 border border-theme-border flex items-center justify-center text-theme-primary font-bold"
              >
                {post.usuario_nome?.slice(0, 1) || "U"}
              </button>

              <div className="min-w-0">
                <button
                  onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)}
                  className="text-sm font-bold text-theme-text truncate block"
                >
                  {post.usuario_nome}
                </button>

                <button
                  onClick={() => navigate(`/perfil/loja/${post.id_empresa}`)}
                  className="text-xs text-theme-muted truncate"
                >
                  {post.empresa_nome}
                </button>
              </div>
            </div>

            <span className="text-xs text-theme-muted">
              {new Date(post.criado_em).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <PostMedia
            rawValue={post.imagem_url}
            onClick={() => {}}
            imageClassName="mx-4 mb-4 h-80 overflow-hidden rounded-[24px] border border-theme-border"
            fallbackClassName={`mx-4 mb-4 h-80 rounded-[24px] bg-gradient-to-br ${visual.bg} flex items-center justify-center border border-theme-border`}
            icon={visual.icon}
            iconColor={visual.color}
          />

          <div className="px-4 pb-5">
            <PostActions
              post={post}
              liked={liked}
              likesCount={likesCount}
              commentsCount={comentarios.length}
              onToggleLike={handleCurtir}
              onOpenComments={() => {}}
            />

            <p className="text-sm text-theme-text/90 leading-relaxed">
              <span className="font-bold text-theme-text">
                {post.usuario_nome}
              </span>{" "}
              {post.descricao}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-theme-hover border border-theme-border p-4">
                <p className="text-[11px] uppercase tracking-wide text-theme-muted">
                  Pedido
                </p>
                <p className="text-lg font-black text-theme-text mt-1">
                  R$ {Number(post.total_pedido || 0).toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl bg-theme-hover border border-theme-border p-4">
                <p className="text-[11px] uppercase tracking-wide text-theme-muted">
                  Loja
                </p>
                <p className="text-lg font-black text-theme-text mt-1 truncate">
                  {post.empresa_nome}
                </p>
              </div>
            </div>
          </div>
        </article>

        <section className="bg-theme-surface rounded-[28px] border border-theme-border shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-base font-bold text-theme-text">
              Comentarios
            </h2>
            <p className="text-xs text-theme-muted">
              Conversa, avaliacao e reacao da comunidade
            </p>
          </div>

          <CommentForm onSubmit={handleComentar} />
          <CommentList comentarios={comentarios} />
        </section>
      </div>
    </div>
  );
}