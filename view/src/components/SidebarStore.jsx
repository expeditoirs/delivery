import storeSidebarNav from '../features/store/storeSidebarNav';
import SidebarLayout from './SidebarLayout';

export default function SidebarStore() {
  return (
    <SidebarLayout
      title="Minha Loja"
      subtitle="Gestao da operacao"
      navItems={storeSidebarNav}
      showAuthButtons={false}
    />
  );
}
