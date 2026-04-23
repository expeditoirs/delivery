export default function PostActions({
  post,
  liked,
  likesCount,
  commentsCount,
  onToggleLike,
  onOpenComments,
}) {
  const copyTextFallback = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        alert("Link copiado para a área de transferência.");
      } else {
        alert("Não foi possível copiar o link automaticamente.");
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Não foi possível copiar o link automaticamente.");
    }
  };

  const handleShare = async () => {
    const postUrl = post?.id
      ? `${window.location.origin}/publicacao/${post.id}`
      : window.location.href;

    const shareData = {
      title: "Confira esta publicação",
      text: "Olha esse post aqui",
      url: postUrl,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copiado para a área de transferência.");
        return;
      }

      copyTextFallback(postUrl);
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      copyTextFallback(postUrl);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-theme-muted">
        <button
          type="button"
          onClick={onToggleLike}
          className={`flex items-center gap-1 transition-all duration-150 hover:scale-105 ${
            liked ? "text-theme-accent" : "text-theme-muted hover:text-theme-text"
          }`}
        >
          <span className="material-icons">
            {liked ? "favorite" : "favorite_border"}
          </span>
          <span className="text-xs font-medium">Curtir</span>
        </button>

        <button
          type="button"
          onClick={onOpenComments}
          className="flex items-center gap-1 text-theme-muted hover:text-theme-text transition-all duration-150 hover:scale-105"
        >
          <span className="material-icons">chat_bubble_outline</span>
          <span className="text-xs font-medium">Comentar</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-theme-muted hover:text-theme-text transition-all duration-150 hover:scale-105"
        >
          <span className="material-icons">send</span>
          <span className="text-xs font-medium">Enviar</span>
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-theme-muted mb-2">
        <span className="font-semibold text-theme-text">
          {likesCount} curtidas
        </span>
        <span>{commentsCount} comentários</span>
      </div>
    </div>
  );
}