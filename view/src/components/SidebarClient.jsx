import SidebarLayout from './SidebarLayout';

export default function SidebarClient() {
  const navItems = [
    { to: '/', label: 'Início', icon: 'home', end: true },
    { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
    { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
    { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
    { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
  ];

  return (
    <SidebarLayout
      title="Delivery"
      subtitle="Área do cliente"
      navItems={navItems}
    />
  );
}
