import AdminPageShell from '../../features/admin/components/AdminPageShell';
import AdminPanelSection from '../../features/admin/components/AdminPanelSection';
import { AdminError, AdminLoading } from '../../features/admin/components/AdminFeedback';
import useAdminDashboardData from '../../features/admin/hooks/useAdminDashboardData';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleString('pt-BR');
}

export default function AdminOrders() {
  const { data, error, loading } = useAdminDashboardData();

  return (
    <AdminPageShell
      title="Pedidos da plataforma"
      description="Visualize o fluxo recente de pedidos em uma tela dedicada, sem misturar com a manutencao de lojas e bairros."
    >
      <AdminError message={error} />
      {loading ? (
        <AdminLoading message="Carregando pedidos..." />
      ) : (
        <AdminPanelSection
          title="Pedidos recentes"
          items={data.pedidos || []}
          emptyMessage="Nenhum pedido encontrado."
          renderItem={(item) => (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">Pedido #{item.id}</p>
                <span className="text-sm font-bold text-rose-500">{formatCurrency(item.total)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{item.status}</span>
                <span>{formatDate(item.data_pedido)}</span>
              </div>
            </div>
          )}
        />
      )}
    </AdminPageShell>
  );
}