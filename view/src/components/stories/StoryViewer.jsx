import { useNavigate } from "react-router-dom";

export default function StoryViewer({ story, onClose }) {
  const navigate = useNavigate();

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[32px] bg-white overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">{story.empresa_nome}</p>
            <p className="text-xs text-gray-400">{story.categoria_empresa || "Loja"}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>

        <div className="relative h-[420px] bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 text-white p-6 flex flex-col justify-between">
          <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full" />
          </div>

          <div>
            <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
              <span className="material-icons text-4xl">local_fire_department</span>
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">Destaque da loja</p>
            <h3 className="text-3xl font-black leading-tight">Oferta relâmpago para hoje</h3>
            <p className="mt-3 text-sm text-white/90 leading-relaxed">
              Aproveite pratos populares, combos e entregas rápidas. Toque abaixo para abrir o cardápio completo.
            </p>
          </div>

          <button
            onClick={() => navigate(`/cardapio/${story.id_empresa}`)}
            className="w-full bg-white text-red-500 py-3.5 rounded-2xl font-bold"
          >
            Abrir loja
          </button>
        </div>
      </div>
    </div>
  );
}
