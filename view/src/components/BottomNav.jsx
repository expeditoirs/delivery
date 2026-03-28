import { NavLink } from 'react-router-dom';
import { getCurrentAdmin, getCurrentStore } from '../utils/auth';

export default function BottomNav() {
  const store = getCurrentStore();
  const admin = getCurrentAdmin();

  const navItems = admin
    ? [
        { to: '/admin', label: 'Admin', icon: 'admin_panel_settings', end: true },
        { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
        { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
        { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
        { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
      ]
    : store
      ? [
          { to: '/loja', label: 'Loja', icon: 'storefront', end: true },
          { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
          { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
          { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
          { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
        ]
      : [
          { to: '/', label: 'Início', icon: 'home', end: true },
          { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
          { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
          { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
          { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 theme-surface border-t border-theme flex justify-around items-center h-16 z-50 md:hidden">
      {navItems.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive ? 'text-theme-primary' : 'text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-icons text-[22px]">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && <span className="w-1 h-1 bg-cyan-400 rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
