import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../core/api";

export default function Register() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("usuario");
  const [form, setForm] = useState({ nome: "", email: "", senha: "", nome_empresa: "", categoria_empresa: "", endereco: "", numero: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      if (tipo === "usuario") {
        await api.post("/usuario/", { nome: form.nome, email: form.email, senha: form.senha, numero: form.numero });
      } else {
        await api.post("/empresa/", {
          nome_empresa: form.nome_empresa,
          email: form.email,
          senha: form.senha,
          categoria_empresa: form.categoria_empresa,
          endereco: form.endereco,
          numero: form.numero,
        });
      }
      navigate("/login");
    } catch (error) {
      setErro(error?.response?.data?.detail || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-page flex min-h-screen flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md theme-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="theme-glass w-12 h-12 rounded-2xl flex items-center justify-center"><span className="material-icons text-theme-accent">person_add</span></div>
          <div>
            <h1 className="theme-title text-xl font-bold">Criar conta</h1>
            <p className="text-xs text-theme-muted">Cadastre usuário ou loja</p>
          </div>
        </div>

        <div className="theme-glass mb-5 grid grid-cols-2 rounded-2xl border border-theme p-1">
          <button type="button" onClick={() => setTipo("usuario")} className={`py-2 rounded-xl text-sm font-semibold ${tipo === "usuario" ? "bg-blue-500/15 text-theme-primary" : "text-theme-muted"}`}>Usuário</button>
          <button type="button" onClick={() => setTipo("loja")} className={`py-2 rounded-xl text-sm font-semibold ${tipo === "loja" ? "bg-blue-500/15 text-theme-primary" : "text-theme-muted"}`}>Loja</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tipo === "usuario" ? (
            <div>
              <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Nome</label>
              <input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="Seu nome" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Nome da loja</label>
                <input value={form.nome_empresa} onChange={(e) => updateField("nome_empresa", e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="Ex: Pizza Prime" />
              </div>
              <div>
                <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Categoria</label>
                <input value={form.categoria_empresa} onChange={(e) => updateField("categoria_empresa", e.target.value)} className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="Pizzaria, Hamburgueria..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Endereço</label>
                <input value={form.endereco} onChange={(e) => updateField("endereco", e.target.value)} className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="Rua, avenida..." />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Email</label>
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Senha</label>
            <input type="password" value={form.senha} onChange={(e) => updateField("senha", e.target.value)} required className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Número</label>
            <input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} className="w-full theme-input rounded-xl px-3 py-3 mt-1.5 text-sm" placeholder={tipo === "usuario" ? "Telefone" : "Número do endereço"} />
          </div>

          {erro && <p className="text-sm text-rose-400">{erro}</p>}
          <button type="submit" disabled={loading} className="w-full theme-button-primary py-3.5 rounded-2xl font-bold text-sm disabled:opacity-60">{loading ? "Cadastrando..." : "Criar conta"}</button>
        </form>

        <div className="mt-5 text-sm text-center text-theme-muted">Já tem conta? <Link to="/login" className="text-theme-primary font-semibold">Entrar</Link></div>
      </div>
    </div>
  );
}
