import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import HomeFeed from "./pages/social/HomeFeed";
import Perfil from "./pages/profile/Perfil";
import MeusPedidos from "./pages/social/MeusPedidos";
import Endereco from "./pages/profile/Endereco";
import EditarDados from "./pages/profile/EditarDados";
import Configuracoes from "./pages/profile/Configuracoes";
import Favoritos from "./pages/profile/Favoritos";
import Carrinho from "./pages/social/Carrinho";
import Cardapio from "./pages/social/Cardapio";
import Produto from "./pages/social/Produto";
import Buscar from "./pages/social/Buscar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LojaDashboard from "./pages/store/LojaDashboard";
import PerfilUsuario from "./pages/social/PerfilUsuario";
import PerfilLoja from "./pages/social/PerfilLoja";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNeighborhoods from "./pages/admin/AdminNeighborhoods";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStores from "./pages/admin/AdminStores";
import HomeStore from "./pages/social/HomeStore";
import PublicacaoDetalhe from "./pages/social/PublicacaoDetalhe";

import { CarrinhoProvider } from "./context/CarrinhoContext";
import { getStoredAuth, isAdminSession, isStoreSession } from "./utils/auth";

function ProtectedRoute({ children, allow = ["user", "store", "admin"] }) {
  const auth = getStoredAuth();
  if (!auth) return <Navigate to="/login" replace />;

  const role = auth.administrador ? "admin" : auth.empresa ? "store" : "user";
  if (!allow.includes(role)) {
    if (isAdminSession()) return <Navigate to="/admin" replace />;
    if (isStoreSession()) return <Navigate to="/loja" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <CarrinhoProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomeStore />} />
            <Route path="/social" element={<HomeFeed />} />
            <Route path="/publicacao/:id" element={<PublicacaoDetalhe />} />
            <Route path="/meuspedidos" element={<MeusPedidos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/dados" element={<EditarDados />} />
            <Route path="/perfil/favoritos" element={<Favoritos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil/usuario/:id" element={<PerfilUsuario />} />
            <Route path="/perfil/loja/:id" element={<PerfilLoja />} />
            <Route path="/endereco" element={<Endereco />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/cardapio/:empresa_id" element={<Cardapio />} />
            <Route path="/produto/:id" element={<Produto />} />
            <Route path="/buscar" element={<Buscar />} />
          </Route>

          <Route
            path="/loja"
            element={
              <ProtectedRoute allow={["store", "admin"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LojaDashboard section="overview" />} />
            <Route path="pedidos" element={<LojaDashboard section="orders" />} />
            <Route path="produtos" element={<LojaDashboard section="products" />} />
            <Route path="clientes" element={<LojaDashboard section="customers" />} />
            <Route path="horarios" element={<LojaDashboard section="hours" />} />
            <Route path="configuracoes" element={<LojaDashboard section="settings" />} />
            <Route path="produtos/cadastrar" element={<Navigate to="/loja/produtos" replace />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={["admin"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="lojas" element={<AdminStores />} />
            <Route path="bairros" element={<AdminNeighborhoods />} />
            <Route path="pedidos" element={<AdminOrders />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </CarrinhoProvider>
  );
}

export default App;
