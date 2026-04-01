function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function normalizeStoreCategories(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return input.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function formatStoreCategories(empresa) {
  const categories = normalizeStoreCategories(empresa?.categorias_empresa);
  if (categories.length) return categories.join(' • ');
  return empresa?.categoria_empresa || 'Nao definida';
}

function StatusBadge({ ativo }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
      }`}
    >
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  );
}

export default function AdminStoreCard({ empresa, busyKey, onToggleStatus, onDelete, mesReferencia }) {
  const statusBusy = busyKey === `empresa:status:${empresa.id}`;
  const deleteBusy = busyKey === `empresa:delete:${empresa.id}`;

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-slate-900">{empresa.nome_empresa}</p>
          <p className="mt-1 text-sm text-slate-500">{empresa.email || 'Sem email cadastrado'}</p>
        </div>
        <StatusBadge ativo={empresa.ativo} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Categoria</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{formatStoreCategories(empresa)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Pedidos total</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{empresa.total_pedidos}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-600">Pedidos {mesReferencia || 'do mes'}</p>
          <p className="mt-1 text-sm font-semibold text-amber-800">{empresa.pedidos_mes}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-500">Taxa a pagar</p>
          <p className="mt-1 text-sm font-semibold text-rose-700">{formatCurrency(empresa.taxa_pagar)}</p>
          <p className="mt-1 text-[11px] text-rose-500">{formatCurrency(empresa.taxa_por_pedido)} por pedido</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Faturamento total</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(empresa.faturamento)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(empresa)}
          disabled={statusBusy || deleteBusy}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {statusBusy ? 'Salvando...' : empresa.ativo ? 'Marcar como inativa' : 'Reativar loja'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(empresa)}
          disabled={statusBusy || deleteBusy}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteBusy ? 'Excluindo...' : 'Excluir loja'}
        </button>
      </div>
    </div>
  );
}