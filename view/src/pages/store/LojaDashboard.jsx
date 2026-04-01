import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';
import { useBrowserNotifications } from '../../features/common/hooks/useBrowserNotifications';
import StoreCatalog from '../../features/store/components/StoreCatalog';
import StoreCustomersPanel from '../../features/store/components/StoreCustomersPanel';
import StoreMetricsGrid from '../../features/store/components/StoreMetricsGrid';
import StoreOrdersBoard from '../../features/store/components/StoreOrdersBoard';
import StorePerformanceChart from '../../features/store/components/StorePerformanceChart';
import StoreProductForm from '../../features/store/components/StoreProductForm';
import StorePublications from '../../features/store/components/StorePublications';
import StoreSettingsPanel from '../../features/store/components/StoreSettingsPanel';
import StoreSummary from '../../features/store/components/StoreSummary';
import {
  buildConfiguracao,
  createInitialForm,
  getDeliveryFee,
  getStoreOperationalSnapshot,
  getPrecoPrincipalFromTamanhos,
  getResumoHorario,
  getTamanhosValidos,
  money,
} from '../../features/store/components/storeUtils';
import { useStoreOrderNotifications } from '../../features/store/hooks/useStoreOrderNotifications';
import { fetchStoreOrders, updateOrderStatus } from '../../features/store/services/storeOrdersService';
import { getCurrentStore, getStoredAuth, saveAuth } from '../../utils/auth';

function normalizeOrderStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  if (value === 'novo') return 'pendente';
  return value;
}

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function formatChartLabel(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function buildPerformanceSeries(orders) {
  const series = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const ordersForDay = orders.filter((order) => {
      const orderDate = new Date(order.data_pedido || order.criado_em || Date.now());
      return orderDate >= date && orderDate < nextDate;
    });

    series.push({
      label: formatChartLabel(date),
      total: ordersForDay.reduce((acc, order) => acc + Number(order.total || 0), 0),
      count: ordersForDay.length,
    });
  }

  return series;
}

function buildCustomerSummaries(orders) {
  const customersMap = new Map();

  orders.forEach((order) => {
    const key = String(order.id_usuario || order.cliente_email || order.cliente_nome || order.usuario_nome || order.id);
    const name = order.cliente_nome || order.usuario_nome || 'Cliente';
    const current = customersMap.get(key) || {
      key,
      name,
      totalSpent: 0,
      ordersCount: 0,
      recentOrders: [],
      lastOrder: null,
    };

    current.totalSpent += Number(order.total || 0);
    current.ordersCount += 1;
    current.recentOrders.push(order);

    if (!current.lastOrder || new Date(order.data_pedido || 0) > new Date(current.lastOrder.data_pedido || 0)) {
      current.lastOrder = order;
    }

    customersMap.set(key, current);
  });

  return Array.from(customersMap.values())
    .map((customer) => ({
      ...customer,
      recentOrders: customer.recentOrders
        .sort((a, b) => new Date(b.data_pedido || 0) - new Date(a.data_pedido || 0))
        .slice(0, 2),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

const SECTION_META = {
  overview: {
    eyebrow: 'Store control center',
    title: 'Sua operacao em um painel claro e rapido',
    description: 'Acompanhe vendas, pedidos em andamento e os principais sinais do dia sem pular por telas soltas.',
    primaryAction: { label: 'Ver pedidos agora', target: '/loja/pedidos' },
    secondaryAction: { label: 'Gerenciar produtos', target: '/loja/produtos' },
  },
  orders: {
    eyebrow: 'Fluxo de pedidos',
    title: 'Atualize a fila da loja com poucos cliques',
    description: 'Priorize pedidos pendentes, mova status rapidamente e mantenha a operacao visivel em tempo real.',
    primaryAction: { label: 'Ver visao geral', target: '/loja' },
    secondaryAction: { label: 'Abrir produtos', target: '/loja/produtos' },
  },
  products: {
    eyebrow: 'Catalogo da loja',
    title: 'Organize produtos, fotos e disponibilidade',
    description: 'Cadastre itens, controle horarios por produto e mantenha o cardapio pronto para vender.',
    primaryAction: { label: 'Ir para pedidos', target: '/loja/pedidos' },
    secondaryAction: { label: 'Ver configuracoes', target: '/loja/configuracoes' },
  },
  customers: {
    eyebrow: 'Relacionamento',
    title: 'Veja quem mais compra e quando voltou',
    description: 'Use o historico da loja para entender recorrencia, ticket e pedidos recentes dos seus clientes.',
    primaryAction: { label: 'Abrir pedidos', target: '/loja/pedidos' },
    secondaryAction: { label: 'Voltar ao painel', target: '/loja' },
  },
  hours: {
    eyebrow: 'Horario da operacao',
    title: 'Mantenha o horario principal da loja sempre claro',
    description: 'Defina o horario exibido para os clientes e reduza duvidas sobre disponibilidade da operacao.',
    primaryAction: { label: 'Salvar nas configuracoes', target: '/loja/configuracoes' },
    secondaryAction: { label: 'Ir para produtos', target: '/loja/produtos' },
  },
  settings: {
    eyebrow: 'Configuracoes',
    title: 'Dados da loja separados do restante da rotina',
    description: 'Ajuste categorias, endereco, taxa de entrega e publicacoes sem misturar isso com pedidos e catalogo.',
    primaryAction: { label: 'Abrir horarios', target: '/loja/horarios' },
    secondaryAction: { label: 'Voltar ao painel', target: '/loja' },
  },
};

export default function LojaDashboard({ section = 'overview' }) {
  const navigate = useNavigate();
  const [store] = useState(() => getCurrentStore());
  const [empresa, setEmpresa] = useState(store || null);
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [form, setForm] = useState(createInitialForm());
  const [carregando, setCarregando] = useState(true);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busyItemId, setBusyItemId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const notifications = useBrowserNotifications();

  useEffect(() => {
    if (!store) {
      navigate('/login');
      return;
    }
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const [empresaRes, itensRes, categoriasRes, publicacoesRes, pedidosRes] = await Promise.allSettled([
          api.get('/empresa/me'),
          api.get(`/empresa/${store.id}/itens`, { params: { limit: 120 } }),
          api.get('/categoria/', { params: { empresa_id: store.id } }),
          api.get('/publicacao/', { params: { empresa_id: store.id, limit: 20 } }),
          fetchStoreOrders(store.id, { limit: 50 }),
        ]);

        if (!ativo) return;
        if (empresaRes.status === 'fulfilled') {
          setEmpresa(empresaRes.value.data);
        } else {
          navigate('/login');
          return;
        }
        if (itensRes.status === 'fulfilled') setItens(itensRes.value.data || []);
        if (categoriasRes.status === 'fulfilled') setCategorias(categoriasRes.value.data || []);
        if (pedidosRes.status === 'fulfilled') setPedidos(pedidosRes.value || []);
        if (publicacoesRes.status === 'fulfilled') setPublicacoes(publicacoesRes.value.data || []);
      } catch (error) {
        console.error(error);
        if (ativo) setErro('Nao foi possivel carregar o painel da loja.');
      } finally {
        if (ativo) {
          setCarregando(false);
          setCarregandoPedidos(false);
        }
      }
    }

    carregar();
    return () => { ativo = false; };
  }, [navigate, store]);

  useStoreOrderNotifications({
    storeId: store?.id,
    enabled: notifications.enabled,
    notify: notifications.notify,
    onOrders: useCallback((orders) => {
      setPedidos(orders);
      setCarregandoPedidos(false);
    }, []),
  });

  const totalCatalogo = useMemo(() => itens.reduce((acc, item) => acc + Number(item.preco || 0), 0), [itens]);
  const categoriaSelecionada = useMemo(() => categorias.find((c) => String(c.id) === String(form.id_categoria)), [categorias, form.id_categoria]);
  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100';
  const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400';
  const cardClass = 'rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]';

  const todayOrders = useMemo(() => pedidos.filter((pedido) => isToday(pedido.data_pedido)), [pedidos]);
  const metrics = useMemo(() => {
    const salesToday = todayOrders.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
    const pendingOrders = pedidos.filter((pedido) => !['entregue', 'cancelado'].includes(normalizeOrderStatus(pedido.status))).length;
    return {
      salesToday,
      ordersToday: todayOrders.length,
      ticketAverage: todayOrders.length ? salesToday / todayOrders.length : 0,
      pendingOrders,
    };
  }, [pedidos, todayOrders]);
  const performanceSeries = useMemo(() => buildPerformanceSeries(pedidos), [pedidos]);
  const customers = useMemo(() => buildCustomerSummaries(pedidos), [pedidos]);
  const recentOrders = useMemo(() => [...pedidos].sort((a, b) => new Date(b.data_pedido || 0) - new Date(a.data_pedido || 0)).slice(0, 5), [pedidos]);
  const header = SECTION_META[section] || SECTION_META.overview;
  const operationalSnapshot = useMemo(() => getStoreOperationalSnapshot(empresa), [empresa]);

  function resetForm() {
    setForm(createInitialForm());
  }

  async function cadastrarItem(e) {
    e.preventDefault();
    if (!store) return;
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const tamanhosValidos = getTamanhosValidos(form.tamanhos);
      const usaTamanhos = form.tipo_produto === 'pizza' || Boolean(form.usar_tamanhos);
      if (!form.id_categoria) throw new Error('Selecione a categoria do produto.');
      if (!form.nome.trim()) throw new Error('Informe o nome do produto.');
      if (usaTamanhos && !tamanhosValidos.length) throw new Error('Cadastre pelo menos um tamanho com preco.');
      if (!usaTamanhos && String(form.preco_fixo).trim() === '') throw new Error('Informe o preco fixo do produto.');
      const gruposSabores = (form.grupos_opcoes || []).filter((g) => g.tipo_grupo === 'sabores');
      for (const grupo of gruposSabores) {
        if (Number(grupo.max) < 1) throw new Error('Grupo de sabores precisa permitir pelo menos 1 selecao.');
        if (Number(grupo.min) > Number(grupo.max)) throw new Error('No grupo de sabores, o minimo nao pode ser maior que o maximo.');
      }
      if (form.tipo_produto === 'pizza' && !gruposSabores.length) throw new Error('Pizza precisa de pelo menos um grupo de sabores.');
      if (form.usarControleHorario) {
        const possuiDiaValido = form.horarios.some((d) => d.ativo && d.abertura && d.fechamento);
        if (!possuiDiaValido) throw new Error('Selecione pelo menos um dia com horario de abertura e fechamento.');
      }

      const payloadBase = {
        id_empresa: store.id,
        id_categoria: Number(form.id_categoria),
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco: getPrecoPrincipalFromTamanhos(tamanhosValidos, form.preco_fixo),
        disponibilidade_horarios: getResumoHorario(form),
        tipo_produto: form.tipo_produto || 'normal',
        configuracao: buildConfiguracao({ ...form, tamanhos: tamanhosValidos }),
        img: form.imagemDataUrl || null,
      };

      const { data } = await api.post(`/empresa/${store.id}/itens`, payloadBase);
      setItens((prev) => [data, ...prev]);
      setSucesso('Produto cadastrado com sucesso.');
      resetForm();
    } catch (error) {
      console.error(error);
      setErro(error?.message || 'Nao foi possivel cadastrar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirItem(itemId) {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;
    try {
      await api.delete(`/empresa/${store.id}/itens/${itemId}`);
      setItens((prev) => prev.filter((item) => item.id !== itemId));
      setSucesso('Produto removido do catalogo.');
    } catch (error) {
      console.error(error);
      setErro('Nao foi possivel excluir o item.');
    }
  }

  async function toggleItemAvailability(item) {
    setBusyItemId(item.id);
    try {
      const { data } = await api.put(`/empresa/${store.id}/itens/${item.id}`, {
        ativo: !item.ativo,
      });
      setItens((prev) => prev.map((current) => (current.id === item.id ? data : current)));
      setSucesso(item.ativo ? 'Produto marcado como indisponivel.' : 'Produto reativado no catalogo.');
    } catch (error) {
      console.error(error);
      setErro('Nao foi possivel atualizar a disponibilidade do item.');
    } finally {
      setBusyItemId(null);
    }
  }

  async function excluirPublicacao(publicacaoId) {
    if (!window.confirm('Deseja excluir esta publicacao?')) return;
    try {
      await api.delete(`/publicacao/${publicacaoId}`);
      setPublicacoes((prev) => prev.filter((pub) => pub.id !== publicacaoId));
      setSucesso('Publicacao removida da vitrine.');
    } catch (error) {
      console.error(error);
      setErro('Nao foi possivel excluir a publicacao.');
    }
  }

  async function handleChangeStatus(orderId, status) {
    try {
      const atualizado = await updateOrderStatus(orderId, status);
      setPedidos((prev) => prev.map((item) => (item.id === orderId ? atualizado : item)));
      setSucesso(`Pedido #${orderId} atualizado para ${status}.`);
    } catch (error) {
      console.error(error);
      setErro(error?.response?.data?.detail || 'Nao foi possivel atualizar o pedido.');
    }
  }

  async function salvarDadosLoja(payload) {
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const { data } = await api.put('/empresa/me', payload);
      setEmpresa(data);

      const auth = getStoredAuth();
      if (auth?.empresa) {
        saveAuth({
          ...auth,
          empresa: {
            ...auth.empresa,
            ...data,
          },
          access_token: auth.access_token,
        });
      }

      setSucesso('Dados da loja atualizados com sucesso.');
    } catch (error) {
      console.error(error);
      setErro(error?.response?.data?.detail || 'Nao foi possivel salvar os dados da loja.');
    } finally {
      setSalvando(false);
    }
  }

  if (!store) return null;
  if (carregando) {
    return (
      <div className="min-h-full bg-[linear-gradient(180deg,#fff7ed,#f8fafc)] pb-24">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <h1 className="text-2xl font-black text-slate-900">Painel da loja</h1>
            <p className="mt-2 text-sm text-slate-500">Carregando operacao, pedidos e catalogo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_34%,#f8fafc_100%)] pb-24">
      <div className="mx-auto max-w-7xl px-4 py-5 md:py-8 space-y-6">
        {section === 'overview' ? (
          <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">{header.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight">{empresa?.nome_empresa || 'Sua loja'}: {header.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{header.description}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => navigate(header.primaryAction.target)} className="rounded-2xl bg-[linear-gradient(135deg,#fb923c,#ef4444)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(249,115,22,0.28)]">
                    {header.primaryAction.label}
                  </button>
                  <button onClick={() => navigate(header.secondaryAction.target)} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                    {header.secondaryAction.label}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Pedidos no radar</p>
                  <p className="mt-2 text-3xl font-black text-white">{metrics.pendingOrders}</p>
                  <p className="mt-2 text-sm text-slate-300">Pedidos aguardando acao ou em andamento.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Taxa de entrega</p>
                  <p className="mt-2 text-3xl font-black text-white">{money(getDeliveryFee(empresa))}</p>
                  <p className="mt-2 text-sm text-slate-300">Configurada nas preferencias da loja.</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[30px] border border-white/70 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{header.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">{header.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{header.description}</p>
          </section>
        )}

        {erro && <div className="rounded-[24px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-sm">{erro}</div>}
        {sucesso && <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 shadow-sm">{sucesso}</div>}

        {section === 'overview' && (
          <div className="space-y-6">
            <StoreMetricsGrid metrics={metrics} />
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <StorePerformanceChart series={performanceSeries} />
              <div className="space-y-6">
                <StoreSummary empresa={empresa} itens={itens} totalCatalogo={totalCatalogo} categoriaSelecionada={categoriaSelecionada} publicacoesCount={publicacoes.length} cardClass={cardClass} />
                <section className={cardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pedidos recentes</p>
                      <h2 className="mt-2 text-lg font-black text-slate-900">Fila mais recente</h2>
                    </div>
                    <button onClick={() => navigate('/loja/pedidos')} className="rounded-2xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">Abrir pedidos</button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Pedido #{order.id}</p>
                            <p className="mt-1 text-xs text-slate-500">{order.cliente_nome || order.usuario_nome || 'Cliente'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-orange-600">{money(order.total)}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">{order.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!recentOrders.length && <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">Sem pedidos recentes por enquanto.</div>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {section === 'orders' && (
          <StoreOrdersBoard
            cardClass={cardClass}
            orders={pedidos}
            loading={carregandoPedidos}
            permission={notifications.permission}
            enabled={notifications.enabled}
            requestPermission={notifications.requestPermission}
            disableNotifications={notifications.disableNotifications}
            onChangeStatus={handleChangeStatus}
          />
        )}

        {section === 'products' && (
          <div className="space-y-6">
            <StoreProductForm
              form={form}
              setForm={setForm}
              categorias={categorias}
              cadastrarItem={cadastrarItem}
              resetForm={resetForm}
              salvando={salvando}
              cardClass={cardClass}
              inputClass={inputClass}
              labelClass={labelClass}
            />
            <StoreCatalog
              cardClass={cardClass}
              itens={itens}
              categorias={categorias}
              excluirItem={excluirItem}
              onToggleAvailability={toggleItemAvailability}
              busyItemId={busyItemId}
              navigateToCardapio={() => navigate(`/cardapio/${store.id}`)}
            />
          </div>
        )}

        {section === 'customers' && (
          <StoreCustomersPanel
            customers={customers}
            onOpenOrder={() => navigate('/loja/pedidos')}
          />
        )}

        {section === 'hours' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <StoreSettingsPanel
              key={`${empresa?.id || 'store'}-${empresa?.cache_version || 0}-${empresa?.horarios_funcionamento || ''}-hours`}
              empresa={empresa}
              onSave={salvarDadosLoja}
              saving={salvando}
              cardClass={cardClass}
              inputClass={inputClass}
              labelClass={labelClass}
              mode="hours"
            />
            <section className={`${cardClass} space-y-4`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status da operacao</p>
                <h2 className="mt-2 text-lg font-black text-slate-900">Como a loja esta neste momento</h2>
                <p className="mt-1 text-sm text-slate-500">Esse resumo usa o horario salvo, o modo manual e a pausa temporaria para refletir o estado atual da operacao.</p>
              </div>
              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Status atual</p>
                <p className="mt-3 text-base font-bold text-slate-900">{operationalSnapshot.label}</p>
                <p className="mt-2 text-sm text-slate-600">{operationalSnapshot.detail}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                {empresa?.horarios_funcionamento || 'Defina um horario principal para aparecer ao cliente.'}
              </div>
            </section>
          </div>
        )}

        {section === 'settings' && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <StoreSettingsPanel
              key={`${empresa?.id || 'store'}-${empresa?.cache_version || 0}-${empresa?.config_gerais || ''}-business`}
              empresa={empresa}
              onSave={salvarDadosLoja}
              saving={salvando}
              cardClass={cardClass}
              inputClass={inputClass}
              labelClass={labelClass}
              mode="business"
            />
            <StorePublications cardClass={cardClass} publicacoes={publicacoes} excluirPublicacao={excluirPublicacao} />
          </div>
        )}
      </div>
    </div>
  );
}
