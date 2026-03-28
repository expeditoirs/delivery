import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";

export default function FinalMainLayout() {
  const [endereco, setEndereco] = useState("");

  useEffect(() => {
    const perfil = JSON.parse(localStorage.getItem("perfil"));
    if (perfil) {
      const parts = [perfil.endereco, perfil.numero, perfil.bairro].filter(Boolean);
      setEndereco(parts.join(", "));
    }
  }, []);

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
