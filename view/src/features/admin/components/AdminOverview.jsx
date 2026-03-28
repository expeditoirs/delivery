export default function AdminOverview({ stats }) {
  const cards = [
    { label: 'Lojas', value: stats.empresas },
    { label: 'Usuários', value: stats.usuarios },
    { label: 'Pedidos', value: stats.pedidos },
    { label: 'Faturamento', value: Number(stats.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
