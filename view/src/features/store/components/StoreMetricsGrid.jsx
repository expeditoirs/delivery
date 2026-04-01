import { money } from './storeUtils';

export default function StoreMetricsGrid({ metrics }) {
  const cards = [
    { key: 'salesToday', label: 'Vendas do dia', value: money(metrics.salesToday), icon: 'sell', tone: 'from-orange-500 to-red-500' },
    { key: 'ordersToday', label: 'Pedidos hoje', value: metrics.ordersToday, icon: 'receipt_long', tone: 'from-cyan-500 to-sky-500' },
    { key: 'ticketAverage', label: 'Ticket medio', value: money(metrics.ticketAverage), icon: 'insights', tone: 'from-emerald-500 to-teal-500' },
    { key: 'pendingOrders', label: 'Na operacao', value: metrics.pendingOrders, icon: 'bolt', tone: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className={`h-1.5 bg-gradient-to-r ${card.tone}`} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                <span className="material-icons">{card.icon}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}