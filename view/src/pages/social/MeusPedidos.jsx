import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../core/api";
import { getCurrentAdmin, getCurrentStore, getCurrentUser } from "../../utils/auth";
import { createAuthenticatedEventSource } from "../../utils/realtime";

const statusConfig = {
  "em preparo": { color: "text-amber-300 bg-amber-500/10 border-amber-500/20", icon: "hourglass_top" },
  entregue: { color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20", icon: "check_circle" },
  pendente: { color: "text-orange-300 bg-orange-500/10 border-orange-500/20", icon: "schedule" },
  aceito: { color: "text-sky-300 bg-sky-500/10 border-sky-500/20", icon: "thumb_up" },
  "aguardando retirada": { color: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20", icon: "inventory_2" },
  "saiu para entrega": { color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20", icon: "local_shipping" },
};

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  const cfg = statusConfig[normalized] || { color: "text-slate-300 bg-slate-500/10 border-slate-500/20", icon: "info" };

  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}><span className="material-icons text-xs">{cfg.icon}</span>{status || "Sem status"}</span>;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "Data nao disponivel";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data invalida";
  return date.toLocaleString("pt-BR");
}

export default function MeusPedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const user = getCurrentUser();
  const store = getCurrentStore();
  const admin = getCurrentAdmin();
  const userId = user?.id ?? null;
  const storeId = store?.id ?? null;
  const adminId = admin?.id ?? null;
  const perfilTipo = adminId ? "admin" : storeId ? "store" : userId ? "user" : "guest";

  useEffect(() => {
    let active = true;
    let stream = null;
    let fallbackTimer = null;

    async function load() {
      setLoading(true);
      setErro("");
      try {
        let endpoint = null;
        if (perfilTipo === "admin") endpoint = "/pedido/";
        else if (perfilTipo === "store" && storeId) endpoint = `/pedido/empresa/${storeId}`;
        else if (perfilTipo === "user" && userId) endpoint = `/pedido/usuario/${userId}`;

        if (!endpoint) {
          if (active) {
            setPedidos([]);
            setLoading(false);
          }
          return;
        }

        const { data } = await api.get(endpoint);
        if (active) setPedidos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        if (active) {
          setErro("Nao foi possivel carregar os pedidos.");
          setPedidos([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    if (perfilTipo === "user") stream = createAuthenticatedEventSource("/pedido/stream/usuario");
    else if (perfilTipo === "store") stream = createAuthenticatedEventSource("/pedido/stream/loja");
    else if (perfilTipo === "admin") stream = createAuthenticatedEventSource("/pedido/stream/admin");

    if (stream) {
      stream.addEventListener("order-update", load);
      stream.onerror = () => {
        if (!fallbackTimer) fallbackTimer = window.setInterval(load, 45000);
      };
    } else if (perfilTipo !== "guest") {
      fallbackTimer = window.setInterval(load, 45000);
    }

    return () => {
      active = false;
      if (stream) stream.close();
      if (fallbackTimer) window.clearInterval(fallbackTimer);
    };
  }, [perfilTipo, adminId, storeId, userId]);

  const statusEmAndamento = useMemo(() => ["pendente", "aceito", "em preparo", "aguardando retirada", "saiu para entrega"], []);
  const emAndamento = useMemo(() => pedidos.filter((pedido) => statusEmAndamento.includes((pedido.status || "").toLowerCase())), [pedidos, statusEmAndamento]);
  const historico = useMemo(() => pedidos.filter((pedido) => !statusEmAndamento.includes((pedido.status || "").toLowerCase())), [pedidos, statusEmAndamento]);

  function abrirComposerDoPedido(pedido) {
    navigate('/social', { state: { openComposer: true, pedidoId: pedido.id } });
  }

  function renderPedido(pedido) {
    const podePublicar = perfilTipo === 'user' && String(pedido.status || '').toLowerCase() === 'entregue';

    return (
      <div key={pedido.id} className="theme-glass rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="theme-title text-sm font-semibold">Pedido #{pedido.id}</p>
            <p className="theme-muted mt-1 text-xs">{formatDate(pedido.data_pedido)}</p>
            {(pedido.cliente_nome || pedido.usuario_nome) && <p className="theme-muted mt-2 text-xs">{pedido.cliente_nome || pedido.usuario_nome}</p>}
          </div>
          <StatusBadge status={pedido.status} />
        </div>

        <div className="theme-section rounded-2xl p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="theme-muted">Total</span>
            <span className="theme-title font-bold">{formatCurrency(pedido.total)}</span>
          </div>
        </div>

        {podePublicar ? (
          <button type="button" onClick={() => abrirComposerDoPedido(pedido)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#14b8a6,#06b6d4)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition hover:brightness-110">
            <span className="material-icons text-base">add_a_photo</span>
            Postar no social
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="theme-page pb-24">
      <div className="theme-surface sticky top-0 z-20 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <button onClick={() => navigate(-1)} className="theme-muted mb-4 inline-flex items-center gap-2 text-sm transition hover:text-theme-primary"><span className="material-icons text-lg">arrow_back</span>Voltar</button>
          <div className="flex items-center gap-3">
            <div className="theme-glass flex h-14 w-14 items-center justify-center rounded-3xl"><span className="material-icons text-2xl text-theme-accent">receipt_long</span></div>
            <div>
              <h1 className="theme-title text-2xl font-bold">{perfilTipo === "admin" ? "Todos os pedidos" : perfilTipo === "store" ? "Pedidos da loja" : "Meus pedidos"}</h1>
              <p className="theme-muted text-sm">Acompanhe pedidos em andamento e historico.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-5">
        {loading ? <div className="theme-glass theme-muted rounded-3xl p-5 text-sm">Carregando pedidos...</div> : <>
          {erro && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>}
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="theme-muted text-sm font-bold uppercase tracking-[0.18em]">Em andamento</h2><span className="rounded-full border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-2.5 py-1 text-xs font-semibold text-[#14B8A6]">{emAndamento.length}</span></div>
            <div className="space-y-3">{emAndamento.length ? emAndamento.map(renderPedido) : <div className="theme-glass theme-muted rounded-3xl p-5 text-sm">Nenhum pedido em andamento.</div>}</div>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="theme-muted text-sm font-bold uppercase tracking-[0.18em]">Historico</h2><span className="rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3B82F6]">{historico.length}</span></div>
            <div className="space-y-3">{historico.length ? historico.map(renderPedido) : <div className="theme-glass theme-muted rounded-3xl p-5 text-sm">Nenhum pedido finalizado.</div>}</div>
          </section>
        </>}
      </div>
    </div>
  );
}