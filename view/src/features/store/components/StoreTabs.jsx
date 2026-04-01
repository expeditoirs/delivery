export default function StoreTabs({ aba, setAba }) {
  const tabs = [
    { key: 'pedidos', label: 'Pedidos' },
    { key: 'loja', label: 'Dados da loja' },
    { key: 'produtos', label: 'Cadastrar produto' },
    { key: 'catalogo', label: 'Catalogo' },
    { key: 'publicacoes', label: 'Publicacoes' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setAba(tab.key)}
          className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold ${
            aba === tab.key ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 bg-white text-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
