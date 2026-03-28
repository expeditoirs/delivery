export default function StoryBar({ stories = [], onOpen, loading = false }) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Stories das lojas</h2>
          <p className="text-xs text-gray-400">Ofertas, pratos e novidades em tempo real</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {loading && Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="min-w-[78px] animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-2" />
            <div className="h-3 rounded-full bg-gray-100" />
          </div>
        ))}

        {!loading && stories.map((story) => (
          <button
            key={story.id}
            onClick={() => onOpen?.(story)}
            className="flex flex-col items-center gap-2 min-w-[78px] active:scale-95 transition-transform"
          >
            <div className="p-[2px] rounded-full bg-gradient-to-br from-red-500 via-orange-400 to-yellow-400 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-xl font-bold text-red-500">
                {story.empresa_nome?.slice(0, 1) || "L"}
              </div>
            </div>
            <span className="text-[11px] text-gray-600 text-center leading-tight max-w-[70px] truncate">
              {story.empresa_nome}
            </span>
          </button>
        ))}

        {!loading && !stories.length && (
          <div className="text-sm text-gray-400 py-6">Sem stories por enquanto.</div>
        )}
      </div>
    </section>
  );
}
