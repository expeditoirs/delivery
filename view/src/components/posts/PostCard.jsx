import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostActions from "./PostActions";
import PostMedia from './PostMedia';
import {
  alternarCurtida,
  obterCurtida,
  obterQuantidadeCurtidas,
} from "../../services/curtidasService";
import { listarComentarios } from "../../services/comentariosService";

const imageMeta = {
  pizza: {
    icon: "local_pizza",
    gradient: "from-theme-secondary via-theme-surface to-theme-background",
    iconColor: "text-theme-accent",
  },
  burger: {
    icon: "lunch_dining",
    gradient: "from-theme-primary/20 via-theme-surface to-theme-background",
    iconColor: "text-theme-primary",
  },
  acai: {
    icon: "icecream",
    gradient: "from-theme-accent/20 via-theme-surface to-theme-background",
    iconColor: "text-theme-accent",
  },
};

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(obterCurtida(post.id));
  const [likesCount, setLikesCount] = useState(
    obterQuantidadeCurtidas(post.id) || Math.floor((post.total_pedido || 10) * 2)
  );

  const commentsCount = useMemo(() => listarComentarios(post.id).length, [post.id]);

  const art = imageMeta[post.imagem_url] || {
    icon: "photo",
    gradient: "from-theme-secondary/40 via-theme-surface to-theme-background",
    iconColor: "text-theme-muted",
  };

  function handleToggleLike() {
    const result = alternarCurtida(post.id, likesCount);
    setLiked(result.liked);
    setLikesCount(result.count);
  }

  return (
    <article className="bg-theme-surface rounded-[28px] border border-theme-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)}
            className="w-11 h-11 rounded-full bg-theme-primary/15 border border-theme-border flex items-center justify-center text-theme-primary font-bold"
          >
            {post.usuario_nome?.slice(0, 1) || "U"}
          </button>

          <div className="min-w-0 text-left">
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

        <button onClick={() => navigate(`/publicacao/${post.id}`)}>
          <span className="material-icons text-theme-muted hover:text-theme-text transition-colors">
            more_horiz
          </span>
        </button>
      </div>

      <PostMedia
        rawValue={post.imagem_url}
        onClick={() => navigate(`/publicacao/${post.id}`)}
        imageClassName="mx-4 mb-4 h-72 w-[calc(100%-2rem)] overflow-hidden rounded-[24px] border border-theme-border"
        fallbackClassName={`mx-4 mb-4 h-72 w-[calc(100%-2rem)] rounded-[24px] bg-gradient-to-br ${art.gradient} border border-theme-border flex items-center justify-center`}
        icon={art.icon}
        iconColor={art.iconColor}
      />

      <div className="px-4 pb-5">
        <PostActions
          post={post}
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          onToggleLike={handleToggleLike}
          onOpenComments={() => navigate(`/publicacao/${post.id}`)}
        />

        <p className="text-sm text-theme-text/90 leading-relaxed">
          <button
            onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)}
            className="font-bold mr-1 text-theme-text"
          >
            {post.usuario_nome}
          </button>
          {post.descricao}
        </p>

        <div className="flex items-center justify-between mt-3 text-xs text-theme-muted">
          <span>Pedido de R$ {Number(post.total_pedido || 0).toFixed(2)}</span>
          <span>{new Date(post.criado_em).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </article>
  );
}