import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';
import { clearAuth, getCurrentAdmin, getCurrentStore, getCurrentUser } from '../../utils/auth';
import { applyTheme, getStoredTheme, saveStoredTheme, THEMES } from '../../utils/theme';

function getPerfilStorageKey(currentAdmin, currentStore, currentUser) {
  if (currentAdmin) return `admin_${currentAdmin.id || currentAdmin.email || 'atual'}`;
  if (currentStore) return `store_${currentStore.id || 'atual'}`;
  if (currentUser) return `user_${currentUser.id || 'atual'}`;
  return 'global';
}

function getInitialConfig(perfilStorageKey) {
  try {
    const config = JSON.parse(localStorage.getItem(`config_${perfilStorageKey}`) || '{}');
    return {
      notificacoes: config.notificacoes ?? true,
      somPedidos: config.somPedidos ?? true,
      lembrarSessao: config.lembrarSessao ?? true,
      mostrarEmail: config.mostrarEmail ?? false,
      confirmarSaida: config.confirmarSaida ?? true,
    };
  } catch {
    return {
      notificacoes: true,
      somPedidos: true,
      lembrarSessao: true,
      mostrarEmail: false,
      confirmarSaida: true,
    };
  }
}

function getPasswordResetConfig(currentAdmin, currentStore) {
  if (currentAdmin) {
    return { endpoint: '/admin/reset-senha', profileLabel: 'administrador', email: currentAdmin.email || '' };
  }
  if (currentStore) {
    return { endpoint: '/empresa/reset-senha', profileLabel: 'loja', email: currentStore.email || '' };
  }
  return { endpoint: '/usuario/reset-senha', profileLabel: 'usuario', email: currentUser?.email || '' };
}

function ItemConfiguracao({ icon, titulo, subtitulo, right, onClick, danger = false, children }) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            danger
              ? 'border-red-500/20 bg-red-500/10 text-red-300'
              : 'border-theme theme-icon-surface text-theme-accent'
          }`}
        >
          <span className="material-icons">{icon}</span>
        </div>

        <div className="min-w-0">
          <p className={`font-semibold ${danger ? 'text-red-300' : 'theme-title'}`}>{titulo}</p>
          {subtitulo ? <p className="theme-muted mt-1 text-sm">{subtitulo}</p> : null}
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </>
  );

  if (!onClick) {
    return (
      <div className="theme-glass rounded-3xl px-4 py-4 text-left transition">
        {content}
        {right ? <div className="mt-4 flex items-center justify-end gap-2">{right}</div> : null}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
        danger
          ? 'border-red-500/20 bg-red-500/10 hover:bg-red-500/15'
          : 'border-theme bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{content}</div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <span className={`material-icons ${danger ? 'text-red-300' : 'theme-muted'}`}>chevron_right</span>
        </div>
      </div>
    </button>
  );
}

function ThemeOption({ active, theme, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        active ? 'border-theme bg-white/10' : 'border-theme bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="mb-3 flex gap-2">
        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
        <span className="h-6 w-6 rounded-full border border-theme" style={{ backgroundColor: theme.colors.surface }} />
      </div>
      <p className="theme-title font-semibold">{theme.label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="theme-muted text-xs">{active ? 'Tema ativo' : 'Toque para aplicar'}</p>
        <span className="theme-glass theme-title rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {theme.mode === 'light' ? 'Claro' : 'Escuro'}
        </span>
      </div>
    </button>
  );
}

function ToggleBadge({ active }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-[#14B8A6]/15 text-[#14B8A6]' : 'bg-slate-700/50 text-slate-300'
      }`}
    >
      {active ? 'Ativado' : 'Desativado'}
    </span>
  );
}

function CreditLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-theme bg-white/5 px-4 py-3">
      <span className="theme-muted text-sm">{label}</span>
      <span className="theme-title text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentStore = getCurrentStore();
  const currentAdmin = getCurrentAdmin();

  const perfilStorageKey = useMemo(
    () => getPerfilStorageKey(currentAdmin, currentStore, currentUser),
    [currentAdmin, currentStore, currentUser]
  );

  const initialConfig = useMemo(() => getInitialConfig(perfilStorageKey), [perfilStorageKey]);
  const passwordResetConfig = useMemo(
    () => {
      if (currentAdmin) {
        return { endpoint: '/admin/reset-senha', profileLabel: 'administrador', email: currentAdmin.email || '' };
      }
      if (currentStore) {
        return { endpoint: '/empresa/reset-senha', profileLabel: 'loja', email: currentStore.email || '' };
      }
      return { endpoint: '/usuario/reset-senha', profileLabel: 'usuario', email: currentUser?.email || '' };
    },
    [currentAdmin, currentStore, currentUser]
  );

  const [notificacoes, setNotificacoes] = useState(initialConfig.notificacoes);
  const [somPedidos, setSomPedidos] = useState(initialConfig.somPedidos);
  const [lembrarSessao, setLembrarSessao] = useState(initialConfig.lembrarSessao);
  const [mostrarEmail, setMostrarEmail] = useState(initialConfig.mostrarEmail);
  const [confirmarSaida, setConfirmarSaida] = useState(initialConfig.confirmarSaida);
  const [temaAtual, setTemaAtual] = useState(() => getStoredTheme(perfilStorageKey).id);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');

  function salvarConfig(parcial) {
    const proxima = {
      notificacoes,
      somPedidos,
      lembrarSessao,
      mostrarEmail,
      confirmarSaida,
      ...parcial,
    };

    localStorage.setItem(`config_${perfilStorageKey}`, JSON.stringify(proxima));
    window.dispatchEvent(new Event('app-config-changed'));
  }

  function alternarNotificacoes() {
    const nova = !notificacoes;
    setNotificacoes(nova);
    salvarConfig({ notificacoes: nova });
  }

  function alternarSomPedidos() {
    const nova = !somPedidos;
    setSomPedidos(nova);
    salvarConfig({ somPedidos: nova });
  }

  function alternarLembrarSessao() {
    const nova = !lembrarSessao;
    setLembrarSessao(nova);
    salvarConfig({ lembrarSessao: nova });
  }

  function alternarMostrarEmail() {
    const nova = !mostrarEmail;
    setMostrarEmail(nova);
    salvarConfig({ mostrarEmail: nova });
  }

  function alternarConfirmarSaida() {
    const nova = !confirmarSaida;
    setConfirmarSaida(nova);
    salvarConfig({ confirmarSaida: nova });
  }

  function selecionarTema(themeId) {
    const tema = saveStoredTheme(perfilStorageKey, themeId);
    applyTheme(tema);
    setTemaAtual(tema.id);
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setErroSenha('');
    setSucessoSenha('');

    if (!passwordResetConfig.email) {
      setErroSenha('Nao foi possivel identificar o email desta conta.');
      return;
    }

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      setErroSenha('A confirmacao da senha nao confere.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await api.post(passwordResetConfig.endpoint, {
        email: passwordResetConfig.email,
        nova_senha: novaSenha,
      });
      setSucessoSenha(`Senha do ${passwordResetConfig.profileLabel} atualizada com sucesso.`);
      setNovaSenha('');
      setConfirmacaoSenha('');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setErroSenha(error?.response?.data?.detail || 'Nao foi possivel atualizar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  }

  function handleLogout() {
    if (confirmarSaida) {
      const shouldExit = window.confirm('Deseja realmente sair da conta?');
      if (!shouldExit) return;
    }

    clearAuth();
    navigate('/login');
  }

  const cardClass =
    'theme-glass rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.18)]';

  return (
    <div className="theme-page pb-24">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="theme-muted mb-4 inline-flex items-center gap-2 text-sm hover:text-theme-primary"
          >
            <span className="material-icons text-lg">arrow_back</span>
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <div className="theme-glass flex h-14 w-14 items-center justify-center rounded-3xl">
              <span className="material-icons text-2xl text-[#14B8A6]">settings</span>
            </div>

            <div>
              <h1 className="theme-title text-2xl font-bold">Configuracoes</h1>
              <p className="theme-muted text-sm">Ajustes gerais do app e da sua conta.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Preferencias</h2>

          <div className="space-y-3">
            <ItemConfiguracao
              icon="notifications"
              titulo="Notificacoes"
              subtitulo="Receber alertas do app"
              right={<ToggleBadge active={notificacoes} />}
              onClick={alternarNotificacoes}
            />

            {(currentStore || currentAdmin) ? (
              <ItemConfiguracao
                icon="volume_up"
                titulo="Som de pedidos"
                subtitulo="Ativar alerta sonoro para eventos importantes"
                right={<ToggleBadge active={somPedidos} />}
                onClick={alternarSomPedidos}
              />
            ) : null}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Tema</h2>

          <ItemConfiguracao
            icon="palette"
            titulo="Aparencia"
            subtitulo="Escolha um tema para este perfil neste navegador"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {Object.values(THEMES).map((theme) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  active={temaAtual === theme.id}
                  onClick={() => selecionarTema(theme.id)}
                />
              ))}
            </div>
          </ItemConfiguracao>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Conta</h2>

          <div className="space-y-3">
            <ItemConfiguracao
              icon="badge"
              titulo="Editar dados"
              subtitulo="Nome, telefone, email e bio"
              onClick={() => navigate('/perfil/dados')}
            />

            {!currentAdmin ? (
              <ItemConfiguracao
                icon="location_on"
                titulo="Editar endereco"
                subtitulo="Rua, numero, bairro, cidade e complemento"
                onClick={() => navigate('/endereco')}
              />
            ) : null}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Privacidade e seguranca</h2>

          <div className="space-y-3">
            <ItemConfiguracao
              icon="verified_user"
              titulo="Lembrar sessao"
              subtitulo="Manter este perfil conectado neste navegador"
              right={<ToggleBadge active={lembrarSessao} />}
              onClick={alternarLembrarSessao}
            />

            <ItemConfiguracao
              icon="alternate_email"
              titulo="Mostrar email nas telas internas"
              subtitulo="Controla se o email pode aparecer em cabecalhos e areas da conta"
              right={<ToggleBadge active={mostrarEmail} />}
              onClick={alternarMostrarEmail}
            />

            <ItemConfiguracao
              icon="logout"
              titulo="Confirmar antes de sair"
              subtitulo="Pedir confirmacao ao encerrar a sessao neste dispositivo"
              right={<ToggleBadge active={confirmarSaida} />}
              onClick={alternarConfirmarSaida}
            />
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Senha</h2>

          <ItemConfiguracao
            icon="lock_reset"
            titulo="Alterar senha"
            subtitulo={`Conta atual: ${passwordResetConfig.email || 'email nao encontrado'}`}
          >
            <form className="space-y-3" onSubmit={handlePasswordReset}>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted">Nova senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  className="w-full rounded-2xl border border-theme bg-white/5 px-4 py-3 text-sm theme-title outline-none focus:border-[#14B8A6]"
                  placeholder="Digite a nova senha"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmacaoSenha}
                  onChange={(event) => setConfirmacaoSenha(event.target.value)}
                  className="w-full rounded-2xl border border-theme bg-white/5 px-4 py-3 text-sm theme-title outline-none focus:border-[#14B8A6]"
                  placeholder="Repita a nova senha"
                />
              </div>

              {erroSenha ? <p className="text-sm text-rose-400">{erroSenha}</p> : null}
              {sucessoSenha ? <p className="text-sm text-emerald-400">{sucessoSenha}</p> : null}

              <button
                type="submit"
                disabled={salvandoSenha}
                className="w-full rounded-2xl bg-[#14B8A6] px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoSenha ? 'Salvando...' : 'Atualizar senha'}
              </button>
            </form>
          </ItemConfiguracao>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Creditos</h2>

          <div className="space-y-3">
            <CreditLine label="Aplicacao" value="Delivery" />
            <CreditLine label="Frontend" value="React + Vite" />
            <CreditLine label="Backend" value="FastAPI" />
            <CreditLine label="Tema atual" value={THEMES[temaAtual]?.label || 'Personalizado'} />
            <CreditLine label="Perfil ativo" value={currentAdmin ? 'Administrador' : currentStore ? 'Loja' : 'Cliente'} />
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="theme-title mb-4 text-base font-semibold">Sessao</h2>

          <div className="space-y-3">
            <ItemConfiguracao
              icon="logout"
              titulo="Sair da conta"
              subtitulo="Encerrar sessao neste dispositivo"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}