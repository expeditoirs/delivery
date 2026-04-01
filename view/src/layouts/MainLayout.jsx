import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";
import { useBrowserNotifications } from "../features/common/hooks/useBrowserNotifications";
import { useUserOrderNotifications } from "../features/common/hooks/useUserOrderNotifications";
import { getCurrentUser } from "../utils/auth";

function readEnderecoSnapshot() {
  try {
    const perfil = JSON.parse(localStorage.getItem("perfil") || "null");
    if (!perfil) return "";
    return [perfil.endereco, perfil.numero || perfil.numero_endereco, perfil.bairro].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

export default function FinalMainLayout() {
  const [endereco, setEndereco] = useState(() => readEnderecoSnapshot());
  const [currentUser] = useState(() => getCurrentUser());
  const notifications = useBrowserNotifications();

  useEffect(() => {
    const syncEndereco = () => setEndereco(readEnderecoSnapshot());

    window.addEventListener("storage", syncEndereco);
    window.addEventListener("auth-changed", syncEndereco);
    window.addEventListener("profile-changed", syncEndereco);

    return () => {
      window.removeEventListener("storage", syncEndereco);
      window.removeEventListener("auth-changed", syncEndereco);
      window.removeEventListener("profile-changed", syncEndereco);
    };
  }, []);

  useUserOrderNotifications({
    userId: currentUser?.id,
    enabled: notifications.enabled,
    notify: notifications.notify,
  });

  return (
    <div className="flex w-full h-[100dvh] bg-theme overflow-hidden">
      <aside className="hidden md:flex md:flex-col w-64 theme-surface border-r border-theme flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col w-full min-w-0">
        <div className="flex-shrink-0">
          <TopBar endereco={endereco} />
        </div>

        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        <div className="md:hidden flex-shrink-0 h-16">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}