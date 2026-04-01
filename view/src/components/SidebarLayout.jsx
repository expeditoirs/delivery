import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';

export default function SidebarLayout({
  title,
  subtitle,
  navItems,
  showAuthButtons = true,
}) {
  const navigate = useNavigate();

  const hasSession =
    getCurrentUser() || getCurrentStore() || getCurrentAdmin();

  function sair() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-6 px-2 pt-2">
        <h1 className="text-2xl font-bold text-theme-primary">{title}</h1>
        <p className="text-xs text-theme-muted mt-0.5">{subtitle}</p>
      </div>

      {hasSession ? (
        <button
          onClick={sair}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm theme-title hover:bg-white/10"
        >
          <span className="material-icons text-xl">logout</span>
          Sair
        </button>
      ) : showAuthButtons ? (
        <div className="flex flex-col gap-1 mb-2">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-blue-500/15 text-theme-primary font-semibold'
                  : 'theme-title hover:bg-white/10'
              }`
            }
          >
            <span className="material-icons text-xl">login</span>
            Entrar
          </NavLink>

          <NavLink
            to="/cadastro"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-blue-500/15 text-theme-primary font-semibold'
                  : 'theme-title hover:bg-white/10'
              }`
            }
          >
            <span className="material-icons text-xl">person_add</span>
            Cadastrar
          </NavLink>
        </div>
      ) : null}

      <div className="border-t border-theme mb-2" />

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm ${
                isActive
                  ? 'bg-blue-500/15 text-theme-primary font-semibold'
                  : 'theme-title hover:bg-white/10'
              }`
            }
          >
            <span className="material-icons text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
