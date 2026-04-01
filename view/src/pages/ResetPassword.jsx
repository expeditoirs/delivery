import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../core/api';
import { getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';

const RESET_OPTIONS = [
  { key: 'user', label: 'Cliente', subtitle: 'Redefinir senha de usuario' },
  { key: 'store', label: 'Loja', subtitle: 'Redefinir senha da loja' },
  { key: 'admin', label: 'Admin', subtitle: 'Redefinir senha do administrador' },
];

const RESET_CONFIG = {
  user: {
    endpoint: '/usuario/reset-senha',
    successMessage: 'Senha do usuario redefinida com sucesso.',
  },
  store: {
    endpoint: '/empresa/reset-senha',
    successMessage: 'Senha da loja redefinida com sucesso.',
  },
  admin: {
    endpoint: '/admin/reset-senha',
    successMessage: 'Senha do administrador redefinida com sucesso.',
  },
};

function ResetOptionButton({ active, label, subtitle, onClick }) {
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('user');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getCurrentAdmin()) navigate('/admin', { replace: true });
    else if (getCurrentStore()) navigate('/loja', { replace: true });
    else if (getCurrentUser()) navigate('/', { replace: true });
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setSucesso('');

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro('A confirmacao da senha nao confere.');
      return;
    }

    setLoading(true);
    try {
      await api.post(RESET_CONFIG[loginType].endpoint, {
        email,
        nova_senha: novaSenha,
      });
      setSucesso(`${RESET_CONFIG[loginType].successMessage} Entre novamente com a nova senha.`);
      setNovaSenha('');
      setConfirmacao('');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setErro(error?.response?.data?.detail || 'Nao foi possivel redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-page flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm theme-card rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="theme-glass flex h-10 w-10 items-center justify-center rounded-xl">
            <span className="material-icons text-theme-primary">lock_reset</span>
          </div>
          <div>
            <h1 className="theme-title text-xl font-bold">Redefinir senha</h1>
            <p className="text-xs text-theme-muted">Escolha o tipo de acesso e defina uma nova senha</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {RESET_OPTIONS.map((option) => (
            <ResetOptionButton
              key={option.key}
              active={loginType === option.key}
              label={option.label}
              subtitle={option.subtitle}
              onClick={() => setLoginType(option.key)}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm theme-input focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              placeholder="Digite a nova senha"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Confirmar senha</label>
            <input
              type="password"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm theme-input focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              placeholder="Repita a nova senha"
            />
          </div>

          {erro ? <p className="text-sm text-rose-400">{erro}</p> : null}
          {sucesso ? <p className="text-sm text-emerald-400">{sucesso}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-4 text-base font-bold theme-button-primary transition-transform active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-theme-muted">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-theme-primary">
            Voltar para entrar
          </Link>
        </p>
      </div>
    </div>
  );
}