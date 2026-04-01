import adminSidebarNav from '../features/admin/adminSidebarNav';
import SidebarLayout from './SidebarLayout';

export default function SidebarAdmin() {
  return (
    <SidebarLayout
      title="Admin"
      subtitle="Controle da plataforma"
      navItems={adminSidebarNav}
      showAuthButtons={false}
    />
  );
}