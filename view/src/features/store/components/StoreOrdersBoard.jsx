import { useMemo, useState } from 'react';
import { money } from './storeUtils';

const COLUMNS = [
  { key: 'pendente', title: 'Aceitar pedidos', nextStatus: 'aceito', nextLabel: 'Aceitar pedido' },
  { key: 'aceito', title: 'Em andamento', nextStatus: 'em preparo', nextLabel: 'Enviar para preparo' },
  { key: 'em preparo', title: 'Em preparo', nextStatus: 'aguardando retirada', nextLabel: 'Aguardando retirada' },
  { key: 'aguardando retirada', title: 'Aguardando retirada', nextStatus: 'saiu para entrega', nextLabel: 'Saiu para entrega' },
  { key: 'saiu para entrega', title: 'Saiu para entrega', nextStatus: 'entregue', nextLabel: 'Marcar entregue' },
];

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  if (value === 'novo') return 'pendente';
  return value;
}

export default function StoreOrdersBoard({
  cardClass,
  orders,
  loading,
  permission,
  enabled,
  requestPermission,
  disableNotifications,
  onChangeStatus,
}) {
  const [savingId, setSavingId] = useState(null);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((col) => [col.key, []]));
    orders.forEach((order) => {
      const key = normalizeStatus(order.status);
      if (map[key]) map[key].push(order);
    });
    return map;
  }, [orders]);

  async function handleAdvance(orderId, nextStatus) {
    setSavingId(orderId);
    try {
      await onChangeStatus(orderId, nextStatus);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClass} flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
        <div>
          <h2 className="text-base font-bold text-gray-900">Pedidos da loja</h2>
          <p className="text-sm text-gray-400 mt-1">Painel operacional com atualização por consulta periódica.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-2 rounded-full border ${enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            Notificações: {enabled ? 'ativas' : permission === 'denied' ? 'bloqueadas' : 'inativas'}
          </span>
          {!enabled && permission !== 'denied' && <button onClick={requestPermission} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">Ativar notificações</button>}
          {enabled && <button onClick={disableNotifications} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700">Desativar</button>}
        </div>
      </div>

      <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-4">
        {COLUMNS.map((column) => (
          <section key={column.key} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm min-h-[220px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-900">{column.title}</h3>
              <span className="text-xs text-gray-400">{grouped[column.key]?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {(grouped[column.key] || []).map((order) => (
                <article key={order.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Pedido #{order.id}</p>
                      <p className="text-xs text-gray-400">{order.cliente_nome || order.usuario_nome || 'Cliente'}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-500">{money(order.total)}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <p>{order.total_itens || 0} item(ns)</p>
                    <p>{order.data_pedido ? new Date(order.data_pedido).toLocaleString('pt-BR') : 'Sem data'}</p>
                    {(order.endereco_bairro || order.endereco_rua) && <p>{[order.endereco_rua, order.endereco_numero, order.endereco_bairro].filter(Boolean).join(', ')}</p>}
                  </div>
                  <button
                    onClick={() => handleAdvance(order.id, column.nextStatus)}
                    disabled={savingId === order.id}
                    className="mt-3 w-full px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {savingId === order.id ? 'Atualizando...' : column.nextLabel}
                  </button>
                </article>
              ))}
              {!loading && !(grouped[column.key] || []).length && <div className="text-xs text-gray-400 rounded-2xl border border-dashed border-gray-200 p-3">Sem pedidos nessa etapa.</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
