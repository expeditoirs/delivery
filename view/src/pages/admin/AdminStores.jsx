import AdminPageShell from '../../features/admin/components/AdminPageShell';
import { AdminError, AdminLoading } from '../../features/admin/components/AdminFeedback';
import AdminStoreCard from '../../features/admin/components/AdminStoreCard';
import useAdminDashboardData from '../../features/admin/hooks/useAdminDashboardData';

export default function AdminStores() {
  const { busyKey, data, deleteEmpresa, error, loading, toggleEmpresaStatus } = useAdminDashboardData();

  async function handleToggleEmpresa(empresa) {
    await toggleEmpresaStatus(empresa.id, !empresa.ativo);
  }

  async function handleDeleteEmpresa(empresa) {
    const confirmed = window.confirm(`Excluir a loja ${empresa.nome_empresa}? Essa acao remove dados vinculados.`);
    if (!confirmed) return;
    await deleteEmpresa(empresa.id);
  }

  return (
    <AdminPageShell
      title="Gestao de lojas"
      description={`Ative, inative ou exclua lojas e acompanhe pedidos totais e a taxa mensal de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats?.taxa_por_pedido || 0.5)} por pedido.`}
    >
      <AdminError message={error} />
      {loading ? (
        <AdminLoading message="Carregando lojas..." />
      ) : (
        <div className="grid gap-4">
          {(data.empresas || []).length ? (
            data.empresas.map((empresa) => (
              <AdminStoreCard
                key={empresa.id}
                empresa={empresa}
                busyKey={busyKey}
                mesReferencia={data.stats?.mes_referencia}
                onToggleStatus={handleToggleEmpresa}
                onDelete={handleDeleteEmpresa}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Nenhuma loja encontrada.
            </div>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}