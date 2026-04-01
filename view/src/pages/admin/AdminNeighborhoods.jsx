import AdminPageShell from '../../features/admin/components/AdminPageShell';
import { AdminError, AdminLoading } from '../../features/admin/components/AdminFeedback';
import AdminNeighborhoodManager from '../../features/admin/components/AdminNeighborhoodManager';
import useAdminDashboardData from '../../features/admin/hooks/useAdminDashboardData';

export default function AdminNeighborhoods() {
  const { busyKey, createBairro, data, deleteBairro, error, loading } = useAdminDashboardData();

  return (
    <AdminPageShell
      title="Gestao de bairros"
      description="Cadastre e remova bairros por cidade, mantendo a operacao de entrega organizada."
    >
      <AdminError message={error} />
      {loading ? (
        <AdminLoading message="Carregando bairros..." />
      ) : (
        <AdminNeighborhoodManager
          bairros={data.bairros || []}
          busyKey={busyKey}
          cidades={data.cidades || []}
          createBairro={createBairro}
          deleteBairro={deleteBairro}
        />
      )}
    </AdminPageShell>
  );
}