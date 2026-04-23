import { formatStoreCategories } from "../../../utils/storeCategories";

export default function RestaurantStrip({ empresas, loading, onOpen }) {
  return (
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-slate-50">Lojas em destaque</h2>
          <p className="text-xs text-theme-muted">Escolha rapido e abra o cardapio</p>
        </div>
        <span className="text-xs text-theme-muted">Top locais</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-w-[190px] theme-card rounded-3xl p-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-slate-700/60 mb-3" />
            <div className="h-4 rounded-full bg-slate-700/60 mb-2" />
            <div className="h-3 rounded-full bg-slate-800/90 w-2/3" />
          </div>
        ))}

        {!loading && empresas.map((empresa) => (
          <button
            type="button"
            key={empresa.id}
            onClick={() => onOpen(empresa)}
            className="min-w-[190px] theme-card rounded-3xl p-4 text-left transition-all duration-150 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-theme-primary mb-3">
              <span className="material-icons">storefront</span>
            </div>
            <p className="font-bold text-sm text-slate-50 truncate">{empresa.nome_empresa}</p>
            <p className="text-xs text-theme-muted mt-1 truncate">{formatStoreCategories(empresa, "Loja")}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-theme-muted">
              <span className="inline-flex items-center gap-1">
                <span className="material-icons text-sm text-cyan-400">star</span>
                4.9
              </span>
              <span>Entrega rapida</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}