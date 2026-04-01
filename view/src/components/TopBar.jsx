import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useMemo, useState } from 'react';
import { CarrinhoContext } from '../context/CarrinhoContext';
import { clearAuth, getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';

export default function TopBar({ endereco }) {
  const navigate = useNavigate();
  const { carrinho } = useContext(CarrinhoContext);
  const [session, setSession] = useState({
    user: getCurrentUser(),
    store: getCurrentStore(),
    admin: getCurrentAdmin(),
  });

  useEffect(() => {
    const sync = () =>
      setSession({
        user: getCurrentUser(),
        store: getCurrentStore(),
        admin: getCurrentAdmin(),
      });

    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync);
    };
  }, []);

  const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
  const role = session.admin ? 'admin' : session.store ? 'store' : 'user';

  const profileLabel = useMemo(() => {
    if (session.admin) return session.admin.email;
    if (session.store) return session.store.nome_empresa;
    if (session.user) return session.user.nome;
    return null;
  }, [session.admin, session.store, session.user]);

  const profileTarget = role === 'admin' ? '/admin' : role === 'store' ? '/loja' : '/perfil';

  return (
    <div className="flex h-16 items-center border-b border-theme px-4 theme-surface">
      <div className="flex w-full items-center justify-between gap-3">
        {role === 'user' ? (
          <button onClick={() => navigate('/endereco')} className="flex max-w-[58%] items-center gap-1.5 overflow-hidden">
            <span className="material-icons text-xl text-theme-primary">location_on</span>
            <div className="overflow-hidden text-left">
              <p className="text-xs leading-tight text-theme-muted">Entregar em</p>
              <p className="theme-title truncate text-sm font-semibold leading-tight">
                {endereco || 'Defina seu endereço'}
              </p>
            </div>
          </button>
        ) : (
          <div className="overflow-hidden">
            <p className="text-xs leading-tight text-theme-muted">
              {role === 'admin' ? 'Sessão administrativa' : 'Painel da loja'}
            </p>
            <p className="theme-title truncate text-sm font-semibold leading-tight">
              {profileLabel || (role === 'admin' ? 'Administrador' : 'Loja')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1">
          {profileLabel ? (
            <button
              onClick={() => navigate(profileTarget)}
              className="hidden max-w-44 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold theme-button-secondary sm:flex"
            >
              <span className="material-icons text-base text-theme-primary">account_circle</span>
              <span className="truncate">{profileLabel}</span>
            </button>
          ) : null}

          <button
            onClick={() => {
              if (profileLabel) {
                clearAuth();
                navigate('/login');
                return;
              }
              navigate('/login');
            }}
            className="p-2 theme-muted"
            title={profileLabel ? 'Sair' : 'Entrar'}
          >
            <span className="material-icons text-[22px]">{profileLabel ? 'logout' : 'login'}</span>
          </button>

          {role === 'user' ? (
            <button onClick={() => navigate('/carrinho')} className="relative p-2">
              {totalItens > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold leading-none text-white">
                  {totalItens}
                </span>
              ) : null}
              <span className="material-icons theme-title">shopping_bag</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
