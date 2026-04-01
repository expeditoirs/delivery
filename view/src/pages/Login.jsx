import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../core/api';
import { getCurrentAdmin, getCurrentStore, getCurrentUser, saveAuth } from '../utils/auth';

const LOGIN_OPTIONS = [
  {
    key: 'user',
    label: 'Cliente',
    subtitle: 'Entrar como usuario do app',
  },
  {
    key: 'store',
    label: 'Loja',
    subtitle: 'Entrar no painel da loja',
  },
  {
    key: 'admin',
    label: 'Admin',
    subtitle: 'Entrar no painel administrativo',
  },
];

const LOGIN_CONFIG = {
  user: {
    endpoint: '/usuario/login',
    navigateTo: '/',
    buildAuth: (data) => ({ access_token: data.access_token, usuario: data.usuario }),
    fallbackMessage: 'Email ou senha do usuario incorretos.',
  },
  store: {
    endpoint: '/empresa/login',
    navigateTo: '/loja',
    buildAuth: (data) => ({ access_token: data.access_token, empresa: data.empresa }),
    fallbackMessage: 'Email ou senha da loja incorretos.',
  },
  admin: {
    endpoint: '/admin/login',
    navigateTo: '/admin',
    buildAuth: (data) => ({ access_token: data.access_token, administrador: data.administrador }),
    fallbackMessage: 'Email ou senha do administrador incorretos.',
  },
};

function LoginOptionButton({ active, label, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
        active
          ? 'border-theme bg-white/10 theme-title'
          : 'border-theme theme-glass text-theme-muted hover:bg-white/10'
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs">{subtitle}</p>
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('user');

  useEffect(() => {
    if (getCurrentAdmin()) navigate('/admin', { replace: true });
    else if (getCurrentStore()) navigate('/loja', { replace: true });
    else if (getCurrentUser()) navigate('/', { replace: true });
  }, [navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setErro('');
    setLoading(true);

    const config = LOGIN_CONFIG[loginType];

    try {
      const { data } = await api.post(config.endpoint, { email, senha });
      saveAuth(config.buildAuth(data));
      navigate(config.navigateTo);
    } catch (error) {
      console.error(`Erro no login ${loginType}:`, error);
      setErro(error?.response?.data?.detail || config.fallbackMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-page flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm theme-card rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="theme-glass flex h-10 w-10 items-center justify-center rounded-xl">
            <span className="material-icons text-theme-primary">login</span>
          </div>
          <div>
            <h1 className="theme-title text-xl font-bold">Entrar</h1>
            <p className="text-xs text-theme-muted">Sua sessao fica salva neste navegador ate voce clicar em sair.</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {LOGIN_OPTIONS.map((option) => (
            <LoginOptionButton
              key={option.key}
              active={loginType === option.key}
              label={option.label}
              subtitle={option.subtitle}
              onClick={() => setLoginType(option.key)}
            />
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm theme-input focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm theme-input focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              placeholder="Digite sua senha"
            />
          </div>

          {erro ? <p className="text-sm text-rose-400">{erro}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-4 text-base font-bold theme-button-primary transition-transform active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : `Entrar como ${LOGIN_CONFIG[loginType].navigateTo === '/admin' ? 'admin' : LOGIN_OPTIONS.find((option) => option.key === loginType)?.label.toLowerCase()}`}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-theme-muted">
          Nao tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-theme-primary">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}