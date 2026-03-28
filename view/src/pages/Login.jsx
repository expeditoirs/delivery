import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../core/api';
import { saveAuth } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function tentarLoginUsuario() {
    const { data } = await api.post('/usuario/login', { email, senha });
    saveAuth({ access_token: data.access_token, usuario: data.usuario });
    navigate('/');
  }

  async function tentarLoginLoja() {
    const { data } = await api.post('/empresa/login', { email, senha });
    saveAuth({ access_token: data.access_token, empresa: data.empresa });
    navigate('/loja');
  }

  async function tentarLoginAdmin() {
    const { data } = await api.post('/admin/login', { email, senha });
    saveAuth({ access_token: data.access_token, administrador: data.administrador });
    navigate('/admin');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await tentarLoginUsuario();
      return;
    } catch (errorUsuario) {
      try {
        await tentarLoginLoja();
        return;
      } catch (errorLoja) {
        try {
          await tentarLoginAdmin();
          return;
        } catch (errorAdmin) {
          console.error('Erro no login de usuário:', errorUsuario);
          console.error('Erro no login de loja:', errorLoja);
          console.error('Erro no login de admin:', errorAdmin);
          setErro(errorAdmin?.response?.data?.detail || 'Email ou senha incorretos.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm theme-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center"><span className="material-icons text-theme-primary">login</span></div>
          <div><h1 className="text-xl font-bold text-slate-50">Entrar</h1><p className="text-xs text-theme-muted">Acesse sua conta, sua loja ou o painel admin</p></div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20" placeholder="seu@email.com" /></div>
          <div><label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20" placeholder="••••••••" /></div>
          {erro && <p className="text-sm text-rose-400">{erro}</p>}
          <button type="submit" disabled={loading} className="w-full theme-button-primary py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform disabled:opacity-60">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p className="text-sm text-center text-theme-muted mt-5">Não tem conta? <Link to="/cadastro" className="text-theme-primary font-semibold">Cadastre-se</Link></p>
      </div>
    </div>
  );
}
