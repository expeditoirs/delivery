import { NavLink } from 'react-router-dom';
import { getCurrentAdmin, getCurrentStore } from '../utils/auth';

export default function BottomNav() {
  const store = getCurrentStore();
  const admin = getCurrentAdmin();

  const navItems = admin
    ? [
        { to: '/admin', label: 'Admin', icon: 'admin_panel_settings', end: true },
      ]
    : store
      ? [
          { to: '/loja', label: 'Painel', icon: 'storefront', end: true },
          { to: '/loja/produtos/cadastrar', label: 'Produtos', icon: 'add_box', end: false },
          { to: '/loja/horarios', label: 'Horários', icon: 'schedule', end: false },
        ]
      : [
          { to: '/', label: 'Início', icon: 'home', end: true },
          { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
          { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
          { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
          { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-theme theme-surface md:hidden">
      {navItems.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-150 ${isActive ? 'text-theme-primary' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {({ isActive }) => (
            <>
              <span className={`material-icons text-[22px] transition-transform duration-150 ${isActive ? '' : 'hover:scale-110'}`}>{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
              {isActive ? <span className="mt-0.5 h-1 w-1 rounded-full bg-cyan-400" /> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
