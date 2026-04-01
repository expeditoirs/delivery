function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function AdminOverview({ stats }) {
  const cards = [
    { label: 'Lojas', value: stats.empresas ?? 0 },
    { label: 'Ativas', value: stats.empresas_ativas ?? 0 },
    { label: 'Inativas', value: stats.empresas_inativas ?? 0 },
    { label: 'Bairros', value: stats.bairros ?? 0 },
    { label: 'Usuarios', value: stats.usuarios ?? 0 },
    { label: 'Pedidos', value: stats.pedidos ?? 0 },
    { label: 'Faturamento', value: formatCurrency(stats.faturamento || 0), wide: true },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${card.wide ? 'xl:col-span-2' : ''}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}