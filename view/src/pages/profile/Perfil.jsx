import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getCurrentStore, getCurrentUser } from "../../utils/auth";

function getPerfilStorageKey(currentStore, currentUser) {
  if (currentStore) return `perfil_loja_${currentStore.id || "atual"}`;
  return `perfil_usuario_${currentUser?.id || "atual"}`;
}

function MenuItem({ icon, title, subtitle, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center justify-between rounded-3xl border px-4 py-4 transition-all duration-150 hover:-translate-y-0.5 ${
        danger
          ? "border-red-500/20 bg-red-500/10 hover:bg-red-500/15 hover:shadow-[0_4px_16px_rgba(239,68,68,0.12)]"
          : "border-theme bg-white/5 hover:bg-white/10 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
      }`}
    >
      <div className="flex items-center gap-4 text-left">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            danger
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-theme theme-icon-surface text-theme-accent"
          }`}
        >
          <span className="material-icons">{icon}</span>
        </div>

        <div>
          <p className={`font-semibold ${danger ? "text-red-300" : "theme-title"}`}>
            {title}
          </p>
          {subtitle && (
            <p className="theme-muted text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <span className={`material-icons transition-transform duration-150 group-hover:translate-x-0.5 ${danger ? "text-red-300" : "theme-muted"}`}>
        chevron_right
      </span>
    </button>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentStore = getCurrentStore();

  const perfilStorageKey = useMemo(
    () => getPerfilStorageKey(currentStore, currentUser),
    [currentStore, currentUser]
  );

  const dadosSalvos = JSON.parse(
    localStorage.getItem(perfilStorageKey) ||
      localStorage.getItem("perfil") ||
      "{}"
  );

  const nome =
    dadosSalvos.nome ||
    dadosSalvos.nome_empresa ||
    currentStore?.nome_empresa ||
    currentUser?.nome ||
    "Usuário";

  const telefone =
    dadosSalvos.telefone ||
    dadosSalvos.numero ||
    currentStore?.telefone ||
    currentUser?.numero ||
    "";

  const cidade = dadosSalvos.cidade || currentUser?.cidade || currentStore?.cidade || "";
  const estado = dadosSalvos.estado || currentUser?.estado || currentStore?.estado || "";

  return (
    <div className="theme-page pb-28">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="theme-title text-xl font-bold">
            {currentStore ? "Perfil da Loja" : "Meu Perfil"}
          </h1>
          <p className="theme-muted text-sm">
            Gerencie sua conta e seus dados no app
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5">
        <div className="theme-glass rounded-[28px] overflow-hidden">
          <div className="bg-gradient-to-r from-[#3B82F6]/20 via-[#334155]/30 to-[#14B8A6]/15 p-5">
            <div className="flex items-center gap-4">
              <div className="theme-icon-surface flex h-20 w-20 items-center justify-center rounded-[28px] border border-theme">
                <span className="material-icons text-4xl text-[#14B8A6]">
                  {currentStore ? "storefront" : "person"}
                </span>
              </div>

              <div className="min-w-0">
                <h2 className="theme-title truncate text-xl font-bold">{nome}</h2>
                {telefone && <p className="theme-muted text-sm mt-1">{telefone}</p>}
                {(cidade || estado) && (
                  <p className="theme-muted text-sm mt-1">
                    {[cidade, estado].filter(Boolean).join(" - ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <MenuItem
            icon="badge"
            title="Editar dados pessoais"
            subtitle="Nome, telefone e informações básicas"
            onClick={() => navigate("/perfil/dados")}
          />

          <MenuItem
            icon="location_on"
            title="Editar endereço"
            subtitle="Rua, número, cidade, bairro e complemento"
            onClick={() => navigate("/endereco")}
          />

          <MenuItem
            icon="receipt_long"
            title="Meus pedidos"
            subtitle="Acompanhe pedidos e histórico"
            onClick={() => navigate("/meuspedidos")}
          />

          <MenuItem
            icon="favorite"
            title="Favoritos"
            subtitle="Itens e lojas salvas"
            onClick={() => navigate("favoritos")}
          />

          <MenuItem
            icon="settings"
            title="Configurações"
            subtitle="Preferências e opções do app"
            onClick={() => navigate("/configuracoes")}
          />

          <MenuItem
            icon="logout"
            title="Sair"
            subtitle="Encerrar sessão nesta conta"
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
            danger
          />
        </div>
      </div>
    </div>
  );
}
