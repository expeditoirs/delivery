export default function StoreTabs({ aba, setAba }) {
  const tabs = [
    { key: 'pedidos', label: 'Pedidos' },
    { key: 'produtos', label: 'Cadastrar produto' },
    { key: 'catalogo', label: 'Catálogo' },
    { key: 'publicacoes', label: 'Publicações' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setAba(tab.key)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border ${
            aba === tab.key ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
