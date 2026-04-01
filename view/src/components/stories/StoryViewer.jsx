import { useNavigate } from "react-router-dom";

export default function StoryViewer({ story, onClose }) {
  const navigate = useNavigate();

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[32px] bg-theme-surface border border-theme-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-theme-border">
          <div>
            <p className="font-bold text-theme-text">
              {story.empresa_nome}
            </p>
            <p className="text-xs text-theme-muted">
              {story.categoria_empresa || "Loja"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-theme-hover flex items-center justify-center transition"
          >
            <span className="material-icons text-theme-muted">close</span>
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="relative h-[420px] bg-gradient-to-br from-theme-primary via-theme-accent to-theme-primary text-white p-6 flex flex-col justify-between">
          {/* Barra progresso */}
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full" />
          </div>

          <div>
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mb-4">
              <span className="material-icons text-4xl text-white">
                local_fire_department
              </span>
            </div>

            <p className="text-xs uppercase tracking-[0.24em] text-white/70 mb-2">
              Destaque da loja
            </p>

            <h3 className="text-3xl font-black leading-tight">
              {story.titulo || "Oferta relâmpago para hoje"}
            </h3>

            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              {story.descricao ||
                "Aproveite pratos populares, combos e entregas rápidas."}
            </p>
          </div>

          <button
            onClick={() => navigate(`/cardapio/${story.id_empresa}`)}
            className="w-full bg-theme-surface text-theme-primary py-3.5 rounded-2xl font-bold hover:bg-theme-hover transition"
          >
            Abrir loja
          </button>
        </div>
      </div>
    </div>
  );
}