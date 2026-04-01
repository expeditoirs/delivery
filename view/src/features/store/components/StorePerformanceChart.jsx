import { money } from './storeUtils';

export default function StorePerformanceChart({ series = [] }) {
  const highest = Math.max(...series.map((item) => item.total || 0), 1);

  return (
    <section className="rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Desempenho</p>
          <h2 className="mt-2 text-lg font-black text-slate-900">Ultimos 7 dias</h2>
          <p className="mt-1 text-sm text-slate-500">Evolucao de vendas para acompanhar ritmo da operacao.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total no periodo</p>
          <p className="mt-1 text-lg font-black text-slate-900">{money(series.reduce((acc, item) => acc + Number(item.total || 0), 0))}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {series.map((item) => {
          const height = `${Math.max((Number(item.total || 0) / highest) * 180, 10)}px`;
          return (
            <div key={item.label} className="flex flex-col items-center gap-3">
              <div className="flex h-[220px] w-full items-end justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(241,245,249,0.4),rgba(248,250,252,0.95))] px-2 py-3">
                <div className="relative flex w-full items-end justify-center rounded-[20px] bg-[linear-gradient(180deg,rgba(251,146,60,0.16),rgba(239,68,68,0.08))]">
                  <div className="absolute -top-7 text-[11px] font-semibold text-slate-500">{item.count}</div>
                  <div
                    className="w-full rounded-[18px] bg-[linear-gradient(180deg,#fb923c,#ef4444)] shadow-[0_16px_32px_rgba(249,115,22,0.28)]"
                    style={{ height }}
                    title={`${item.label}: ${money(item.total)} em ${item.count} pedidos`}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700">{item.label}</p>
                <p className="text-[11px] text-slate-400">{money(item.total)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}