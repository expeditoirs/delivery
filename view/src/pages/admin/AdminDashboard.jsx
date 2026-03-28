import { useEffect, useState } from 'react';
import api from '../../core/api';
import AdminOverview from '../../features/admin/components/AdminOverview';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [data, setData] = useState({ stats: {}, empresas: [], usuarios: [], pedidos: [] });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setErro('');
      try {
        const { data } = await api.get('/admin/resumo');
        if (active) setData(data);
      } catch (error) {
        console.error(error);
        if (active) setErro('Não foi possível carregar o painel administrativo.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Administrador geral</h1>
        <p className="text-xs text-gray-400 mt-1">Visão geral de lojas, usuários e pedidos.</p>
      </div>
      <div className="p-4 space-y-4">
        {erro && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}
        {loading ? <div className="text-sm text-gray-400">Carregando painel...</div> : <>
          <AdminOverview stats={data.stats || {}} />
          <div className="grid lg:grid-cols-3 gap-4">
            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><h2 className="font-bold text-gray-900">Lojas</h2><div className="mt-3 space-y-3">{(data.empresas || []).map((item) => <div key={item.id} className="border border-gray-100 rounded-xl p-3"><p className="font-semibold text-sm text-gray-900">{item.nome_empresa}</p><p className="text-xs text-gray-500 mt-1">{item.email || 'Sem email'}</p></div>)}{!(data.empresas || []).length && <p className="text-sm text-gray-400">Nenhuma loja encontrada.</p>}</div></section>
            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><h2 className="font-bold text-gray-900">Usuários</h2><div className="mt-3 space-y-3">{(data.usuarios || []).map((item) => <div key={item.id} className="border border-gray-100 rounded-xl p-3"><p className="font-semibold text-sm text-gray-900">{item.nome || 'Usuário'}</p><p className="text-xs text-gray-500 mt-1">{item.email || 'Sem email'}</p></div>)}{!(data.usuarios || []).length && <p className="text-sm text-gray-400">Nenhum usuário encontrado.</p>}</div></section>
            <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><h2 className="font-bold text-gray-900">Pedidos recentes</h2><div className="mt-3 space-y-3">{(data.pedidos || []).map((item) => <div key={item.id} className="border border-gray-100 rounded-xl p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-sm text-gray-900">Pedido #{item.id}</p><span className="text-xs font-semibold text-red-500">{Number(item.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div><p className="text-xs text-gray-500 mt-1">{item.status}</p></div>)}{!(data.pedidos || []).length && <p className="text-sm text-gray-400">Nenhum pedido encontrado.</p>}</div></section>
          </div>
        </>}
      </div>
    </div>
  );
}
