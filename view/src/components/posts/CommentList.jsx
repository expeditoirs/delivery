function formatDate(date) {
  try {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Agora";
  }
}

export default function CommentList({ comentarios = [] }) {
  if (!comentarios.length) {
    return (
      <div className="rounded-2xl border border-dashed border-theme-border p-4 text-sm text-theme-muted text-center bg-theme-surface">
        Ainda não há comentários. Seja o primeiro a comentar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comentarios.map((comentario) => (
        <div
          key={comentario.id}
          className="bg-theme-surface rounded-2xl p-4 border border-theme-border hover:bg-theme-hover transition"
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-sm font-bold text-theme-text">
              {comentario.usuario_nome || "Cliente"}
            </p>

            <span className="text-[11px] text-theme-muted">
              {formatDate(comentario.criado_em)}
            </span>
          </div>

          <p className="text-sm text-theme-text/90 leading-relaxed">
            {comentario.texto}
          </p>
        </div>
      ))}
    </div>
  );
}