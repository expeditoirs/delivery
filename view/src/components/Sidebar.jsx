import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { clearAuth, getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const [session, setSession] = useState({ user: getCurrentUser(), store: getCurrentStore(), admin: getCurrentAdmin() });

  useEffect(() => {
    const sync = () => setSession({ user: getCurrentUser(), store: getCurrentStore(), admin: getCurrentAdmin() });
    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync);
    };
  }, []);

  const navItems = useMemo(() => {
    if (session.admin) return [
      { to: '/admin', label: 'Admin', icon: 'admin_panel_settings', end: true },
      { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
      { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
      { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
      { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
    ];
    if (session.store) return [
      { to: '/loja', label: 'Painel', icon: 'storefront', end: true },
      { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
      { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
      { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
      { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
    ];
    return [
      { to: '/', label: 'Início', icon: 'home', end: true },
      { to: '/social', label: 'Social', icon: 'dynamic_feed', end: false },
      { to: '/buscar', label: 'Buscar', icon: 'search', end: false },
      { to: '/meuspedidos', label: 'Pedidos', icon: 'receipt_long', end: false },
      { to: '/perfil', label: 'Perfil', icon: 'person', end: false },
    ];
  }, [session.admin, session.store]);

  function sair() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-6 px-2 pt-2">
        <h1 className="text-2xl font-bold text-theme-primary">Delivery</h1>
        <p className="text-xs text-theme-muted mt-0.5">Feed + pedidos + loja</p>
      </div>

      {session.user || session.store || session.admin ? (
        <button onClick={sair} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-200 hover:bg-slate-800/60 mb-2">
          <span className="material-icons text-xl">logout</span>
          Sair
        </button>
      ) : (
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/login" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${isActive ? 'bg-blue-500/15 text-theme-primary font-semibold' : 'text-slate-200 hover:bg-slate-800/60'}`}>
            <span className="material-icons text-xl">login</span>
            Entrar
          </NavLink>
          <NavLink to="/cadastro" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${isActive ? 'bg-blue-500/15 text-theme-primary font-semibold' : 'text-slate-200 hover:bg-slate-800/60'}`}>
            <span className="material-icons text-xl">person_add</span>
            Cadastrar
          </NavLink>
        </div>
      )}

      <div className="border-t border-theme mb-2" />

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm ${isActive ? 'bg-blue-500/15 text-theme-primary font-semibold' : 'text-slate-200 hover:bg-slate-800/60'}`}
          >
            <span className="material-icons text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
