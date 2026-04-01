import { money } from './storeUtils';

function formatDate(value) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function StoreCustomersPanel({ customers = [], onOpenOrder }) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Clientes</p>
          <h2 className="mt-2 text-lg font-black text-slate-900">Relacionamento e historico</h2>
          <p className="mt-1 text-sm text-slate-500">Veja quem compra mais e os ultimos pedidos de cada cliente.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Clientes ativos</p>
          <p className="mt-1 text-lg font-black text-slate-900">{customers.length}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {customers.map((customer) => (
          <article key={customer.key} className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-slate-900">{customer.name}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {customer.ordersCount} pedidos
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Gasto total {money(customer.totalSpent)}</p>
                {customer.lastOrder && (
                  <p className="mt-2 text-xs text-slate-400">Ultimo pedido em {formatDate(customer.lastOrder.data_pedido)}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                {customer.recentOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onOpenOrder?.(order)}
                    className="rounded-2xl border border-white bg-white px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900">Pedido #{order.id}</p>
                      <p className="text-sm font-bold text-orange-600">{money(order.total)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(order.data_pedido)}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{order.status}</p>
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}

        {!customers.length && (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
            Os clientes aparecerao aqui conforme os pedidos forem chegando.
          </div>
        )}
      </div>
    </section>
  );
}