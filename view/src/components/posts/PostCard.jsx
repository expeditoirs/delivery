import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostActions from "./PostActions";
import { alternarCurtida, obterCurtida, obterQuantidadeCurtidas } from "../../services/curtidasService";
import { listarComentarios } from "../../services/comentariosService";

const imageMeta = {
  pizza: {
    icon: "local_pizza",
    gradient: "from-orange-50 via-red-50 to-yellow-50",
    iconColor: "text-orange-300",
  },
  burger: {
    icon: "lunch_dining",
    gradient: "from-amber-50 via-orange-50 to-red-50",
    iconColor: "text-amber-400",
  },
  acai: {
    icon: "icecream",
    gradient: "from-fuchsia-50 via-pink-50 to-purple-50",
    iconColor: "text-fuchsia-300",
  },
};

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(obterCurtida(post.id));
  const [likesCount, setLikesCount] = useState(obterQuantidadeCurtidas(post.id) || Math.floor((post.total_pedido || 10) * 2));
  const commentsCount = useMemo(() => listarComentarios(post.id).length, [post.id]);
  const art = imageMeta[post.imagem_url] || {
    icon: "photo",
    gradient: "from-gray-50 via-slate-50 to-zinc-50",
    iconColor: "text-gray-300",
  };

  function handleToggleLike() {
    const result = alternarCurtida(post.id, likesCount);
    setLiked(result.liked);
    setLikesCount(result.count);
  }

  return (
    <article className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)}
            className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold"
          >
            {post.usuario_nome?.slice(0, 1) || "U"}
          </button>
          <div className="min-w-0 text-left">
            <button onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)} className="text-sm font-bold text-gray-900 truncate block">
              {post.usuario_nome}
            </button>
            <button onClick={() => navigate(`/perfil/loja/${post.id_empresa}`)} className="text-xs text-gray-500 truncate">
              {post.empresa_nome}
            </button>
          </div>
        </div>
        <button onClick={() => navigate(`/publicacao/${post.id}`)}>
          <span className="material-icons text-gray-400">more_horiz</span>
        </button>
      </div>

      <button onClick={() => navigate(`/publicacao/${post.id}`)} className={`mx-4 mb-4 h-72 w-[calc(100%-2rem)] rounded-[24px] bg-gradient-to-br ${art.gradient} border border-white/50 flex items-center justify-center`}>
        <span className={`material-icons text-[88px] ${art.iconColor}`}>{art.icon}</span>
      </button>

      <div className="px-4 pb-5">
        <PostActions
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          onToggleLike={handleToggleLike}
          onOpenComments={() => navigate(`/publicacao/${post.id}`)}
        />
        <p className="text-sm text-gray-800 leading-relaxed">
          <button onClick={() => navigate(`/perfil/usuario/${post.id_usuario}`)} className="font-bold mr-1">
            {post.usuario_nome}
          </button>
          {post.descricao}
        </p>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>Pedido de R$ {Number(post.total_pedido || 0).toFixed(2)}</span>
          <span>{new Date(post.criado_em).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </article>
  );
}
