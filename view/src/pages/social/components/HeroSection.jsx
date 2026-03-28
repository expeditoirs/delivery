export default function HeroSection({ onSearch }) {
  return (
    <section className="px-4 pt-4">
      <div className="theme-card rounded-[28px] p-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-4 bottom-4 w-24 h-24 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative z-10">
          <h1 className="text-xl font-semibold leading-tight text-slate-50">
            O que você vai pedir hoje?
          </h1>

          <button
            type="button"
            onClick={onSearch}
            className="mt-4 w-full theme-input rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-95 transition"
          >
            <span className="material-icons text-theme-muted">search</span>
            <span className="text-sm text-theme-muted">
              Buscar restaurantes, pratos...
            </span>
          </button>

          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
            {["Pizza", "Açaí", "Hambúrguer", "Bebidas"].map((item) => (
              <button
                key={item}
                className="px-3 py-1.5 theme-button-secondary rounded-full text-xs whitespace-nowrap active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
