import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { CarrinhoContext } from "../context/CarrinhoContext";
import { clearAuth, getCurrentStore, getCurrentUser } from "../utils/auth";

export default function TopBar({ endereco }) {
  const navigate = useNavigate();
  const { carrinho } = useContext(CarrinhoContext);
  const [session, setSession] = useState({ user: getCurrentUser(), store: getCurrentStore() });

  useEffect(() => {
    const sync = () => setSession({ user: getCurrentUser(), store: getCurrentStore() });
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);
  const label = useMemo(() => {
    if (session.store) return session.store.nome_empresa;
    if (session.user) return session.user.nome;
    return null;
  }, [session]);

  return (
    <div className="theme-surface border-b border-theme h-16 flex items-center px-4">
      <div className="flex items-center justify-between w-full gap-3">
        <button onClick={() => navigate("/endereco")} className="flex items-center gap-1.5 overflow-hidden max-w-[58%]">
          <span className="material-icons text-theme-primary text-xl flex-shrink-0">location_on</span>
          <div className="text-left overflow-hidden">
            <p className="text-xs text-theme-muted leading-tight">Entregar em</p>
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">{endereco || "Defina seu endereço"}</p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {label ? (
            <button onClick={() => (session.store ? navigate("/loja") : navigate("/perfil"))} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl theme-button-secondary text-xs font-semibold max-w-44 truncate">
              <span className="material-icons text-base text-theme-primary">account_circle</span>
              <span className="truncate">{label}</span>
            </button>
          ) : null}

          <button
            onClick={() => {
              if (label) {
                clearAuth();
                navigate("/login");
                return;
              }
              navigate("/login");
            }}
            className="p-2 text-slate-300"
            title={label ? "Sair" : "Entrar"}
          >
            <span className="material-icons text-[22px]">{label ? "logout" : "login"}</span>
          </button>

          <button onClick={() => navigate("/carrinho")} className="relative p-2">
            {totalItens > 0 && <span className="absolute top-0.5 right-0.5 bg-cyan-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold leading-none">{totalItens}</span>}
            <span className="material-icons text-slate-200">shopping_bag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
