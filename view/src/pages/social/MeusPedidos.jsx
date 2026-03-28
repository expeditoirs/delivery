import { useEffect, useMemo, useState } from 'react';
import api from '../../core/api';
import { getCurrentAdmin, getCurrentStore, getCurrentUser } from '../../utils/auth';

const statusConfig = {
  'em preparo': { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: 'hourglass_top' },
  entregue: { color: 'text-green-600 bg-green-50 border-green-200', icon: 'check_circle' },
  pendente: { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: 'schedule' },
  aceito: { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: 'thumb_up' },
  'aguardando retirada': { color: 'text-purple-600 bg-purple-50 border-purple-200', icon: 'inventory_2' },
  'saiu para entrega': { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: 'local_shipping' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[(status || '').toLowerCase()] || { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: 'info' };
  return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}><span className="material-icons text-xs">{cfg.icon}</span>{status}</span>;
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const store = getCurrentStore();
  const admin = getCurrentAdmin();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const endpoint = admin ? '/pedido/' : store ? `/pedido/empresa/${store.id}` : `/pedido/usuario/${user.id}`;
        const { data } = await api.get(endpoint);
        if (active) setPedidos(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [admin, store, user]);

  const emAndamento = useMemo(() => pedidos.filter((pedido) => ['pendente', 'aceito', 'em preparo', 'aguardando retirada', 'saiu para entrega'].includes((pedido.status || '').toLowerCase())), [pedidos]);
  const historico = useMemo(() => pedidos.filter((pedido) => !['pendente', 'aceito', 'em preparo', 'aguardando retirada', 'saiu para entrega'].includes((pedido.status || '').toLowerCase())), [pedidos]);

  function renderPedido(pedido) {
    return (
      <div key={pedido.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-sm text-gray-900">Pedido #{pedido.id}</p>
            <p className="text-xs text-gray-400">{new Date(pedido.data_pedido).toLocaleString('pt-BR')}</p>
            {(pedido.cliente_nome || pedido.usuario_nome) && <p className="text-xs text-gray-500 mt-1">{pedido.cliente_nome || pedido.usuario_nome}</p>}
          </div>
          <StatusBadge status={pedido.status} />
        </div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">R$ {Number(pedido.total).toFixed(2)}</span></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100"><h1 className="text-xl font-bold text-gray-900">{admin ? 'Todos os pedidos' : store ? 'Pedidos da loja' : 'Meus Pedidos'}</h1></div>
      <div className="p-4 space-y-6">
        {loading ? <div className="text-sm text-gray-400">Carregando pedidos...</div> : <>
          <div><h2 className="text-sm font-bold text-gray-700 mb-3">Em andamento</h2><div className="space-y-3">{emAndamento.length ? emAndamento.map(renderPedido) : <div className="text-sm text-gray-400">Nenhum pedido em andamento.</div>}</div></div>
          <div><h2 className="text-sm font-bold text-gray-700 mb-3">Histórico</h2><div className="space-y-3">{historico.length ? historico.map(renderPedido) : <div className="text-sm text-gray-400">Nenhum pedido finalizado.</div>}</div></div>
        </>}
      </div>
    </div>
  );
}
