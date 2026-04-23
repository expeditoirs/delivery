export default function StoreWorkspaceNav({ section, setSection, pedidos = [], itens = [], clientes = [] }) {
  const navItems = [
    { key: 'overview', label: 'Visao geral', icon: 'space_dashboard', helper: 'Resumo do dia' },
    { key: 'orders', label: 'Pedidos', icon: 'receipt_long', helper: `${pedidos.length} pedidos` },
    { key: 'products', label: 'Produtos', icon: 'inventory_2', helper: `${itens.length} itens` },
    { key: 'customers', label: 'Clientes', icon: 'groups', helper: `${clientes.length} clientes` },
    { key: 'settings', label: 'Configuracoes', icon: 'settings', helper: 'Loja e operacao' },
  ];

  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-white/60 bg-[rgba(248,250,252,0.92)] px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
      <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:pb-0">
        {navItems.map((item) => {
          const active = section === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`min-w-[150px] rounded-2xl border px-4 py-3 text-left transition-all duration-150 md:min-w-0 ${
                active
                  ? 'border-orange-500 bg-[linear-gradient(135deg,#f97316,#ef4444)] text-white shadow-[0_18px_36px_rgba(249,115,22,0.28)] scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/60 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-icons text-xl ${active ? 'text-white' : 'text-orange-500'}`}>{item.icon}</span>
                <div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className={`text-xs ${active ? 'text-orange-100' : 'text-slate-400'}`}>{item.helper}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}