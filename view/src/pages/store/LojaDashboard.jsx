import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';
import { useBrowserNotifications } from '../../features/common/hooks/useBrowserNotifications';
import StoreCatalog from '../../features/store/components/StoreCatalog';
import StoreOrdersBoard from '../../features/store/components/StoreOrdersBoard';
import StoreProductForm from '../../features/store/components/StoreProductForm';
import StorePublications from '../../features/store/components/StorePublications';
import StoreSummary from '../../features/store/components/StoreSummary';
import StoreTabs from '../../features/store/components/StoreTabs';
import { createInitialForm, buildConfiguracao, getPrecoPrincipalFromTamanhos, getResumoHorario, getTamanhosValidos } from '../../features/store/components/storeUtils';
import { useStoreOrderNotifications } from '../../features/store/hooks/useStoreOrderNotifications';
import { fetchStoreOrders, updateOrderStatus } from '../../features/store/services/storeOrdersService';
import { getCurrentStore } from '../../utils/auth';

export default function LojaDashboard() {
  const navigate = useNavigate();
  const [store] = useState(() => getCurrentStore());
  const [empresa, setEmpresa] = useState(store || null);
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [form, setForm] = useState(createInitialForm());
  const [aba, setAba] = useState('pedidos');
  const [carregando, setCarregando] = useState(true);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [salvando, setSalvando] = useState(false);
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
          api.get(`/empresa/${store.id}/itens`),
          api.get('/categoria/'),
          api.get('/publicacao/'),
          fetchStoreOrders(store.id),
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

        if (publicacoesRes.status === 'fulfilled') {
          const todas = publicacoesRes.value.data || [];
          const empresaNome = empresaRes.value?.data?.nome_empresa?.toLowerCase?.() || '';
          const empresaId = empresaRes.value?.data?.id;
          setPublicacoes(todas.filter((pub) => {
            const texto = `${pub?.titulo || ''} ${pub?.conteudo || ''}`.toLowerCase();
            return ((empresaId && (pub?.id_empresa === empresaId || pub?.empresa_id === empresaId)) || (empresaNome && texto.includes(empresaNome)));
          }));
        }
      } catch (error) {
        console.error(error);
        if (ativo) setErro('Não foi possível carregar o painel da loja.');
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
    onOrders: (orders) => {
      setPedidos(orders);
      setCarregandoPedidos(false);
    },
  });

  const totalCatalogo = useMemo(() => itens.reduce((acc, item) => acc + Number(item.preco || 0), 0), [itens]);
  const categoriaSelecionada = useMemo(() => categorias.find((c) => String(c.id) === String(form.id_categoria)), [categorias, form.id_categoria]);
  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300';
  const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';
  const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4';

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
      if (!form.id_categoria) throw new Error('Selecione a categoria do produto.');
      if (!form.nome.trim()) throw new Error('Informe o nome do produto.');
      if (!tamanhosValidos.length) throw new Error('Cadastre pelo menos um tamanho com preço.');
      const gruposSabores = (form.grupos_opcoes || []).filter((g) => g.tipo_grupo === 'sabores');
      for (const grupo of gruposSabores) {
        if (Number(grupo.max) < 1) throw new Error('Grupo de sabores precisa permitir pelo menos 1 seleção.');
        if (Number(grupo.min) > Number(grupo.max)) throw new Error('No grupo de sabores, o mínimo não pode ser maior que o máximo.');
      }
      if (form.usarControleHorario) {
        const possuiDiaValido = form.horarios.some((d) => d.ativo && d.abertura && d.fechamento);
        if (!possuiDiaValido) throw new Error('Selecione pelo menos um dia com horário de abertura e fechamento.');
      }

      const payloadBase = {
        id_empresa: store.id,
        id_categoria: Number(form.id_categoria),
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco: getPrecoPrincipalFromTamanhos(tamanhosValidos),
        disponibilidade_horarios: getResumoHorario(form),
        tipo_produto: 'normal',
        configuracao: buildConfiguracao({ ...form, tamanhos: tamanhosValidos }),
      };

      const { data } = await api.post(`/empresa/${store.id}/itens`, { ...payloadBase, img: null });
      setItens((prev) => [data, ...prev]);
      setSucesso('Produto cadastrado com sucesso.');
      resetForm();
      setAba('catalogo');
    } catch (error) {
      console.error(error);
      setErro(error?.message || 'Não foi possível cadastrar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirItem(itemId) {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;
    try {
      await api.delete(`/empresa/${store.id}/itens/${itemId}`);
      setItens((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error(error);
      setErro('Não foi possível excluir o item.');
    }
  }

  async function excluirPublicacao(publicacaoId) {
    if (!window.confirm('Deseja excluir esta publicação?')) return;
    try {
      await api.delete(`/publicacao/${publicacaoId}`);
      setPublicacoes((prev) => prev.filter((pub) => pub.id !== publicacaoId));
    } catch (error) {
      console.error(error);
      setErro('Não foi possível excluir a publicação.');
    }
  }

  async function handleChangeStatus(orderId, status) {
    try {
      const atualizado = await updateOrderStatus(orderId, status);
      setPedidos((prev) => prev.map((item) => (item.id === orderId ? atualizado : item)));
      setSucesso(`Pedido #${orderId} atualizado para ${status}.`);
    } catch (error) {
      console.error(error);
      setErro(error?.response?.data?.detail || 'Não foi possível atualizar o pedido.');
    }
  }

  if (!store) return null;
  if (carregando) {
    return <div className="bg-gray-50 min-h-full pb-24"><div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100"><h1 className="text-xl font-bold text-gray-900">Painel da Loja</h1><p className="text-xs text-gray-400 mt-1">Carregando informações...</p></div></div>;
  }

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Painel da Loja</h1>
            <p className="text-xs text-gray-400 mt-1">Gerencie pedidos, produtos, horários, catálogo e publicações da sua vitrine.</p>
          </div>
          <button onClick={() => navigate('/perfil')} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold">Perfil</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {erro && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}
        {sucesso && <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">{sucesso}</div>}
        <StoreSummary empresa={empresa} itens={itens} totalCatalogo={totalCatalogo} categoriaSelecionada={categoriaSelecionada} publicacoesCount={publicacoes.length} cardClass={cardClass} />
        <StoreTabs aba={aba} setAba={setAba} />
        {aba === 'pedidos' && <StoreOrdersBoard cardClass={cardClass} orders={pedidos} loading={carregandoPedidos} permission={notifications.permission} enabled={notifications.enabled} requestPermission={notifications.requestPermission} disableNotifications={notifications.disableNotifications} onChangeStatus={handleChangeStatus} />}
        {aba === 'produtos' && <StoreProductForm form={form} setForm={setForm} categorias={categorias} cadastrarItem={cadastrarItem} resetForm={resetForm} salvando={salvando} cardClass={cardClass} inputClass={inputClass} labelClass={labelClass} />}
        {aba === 'catalogo' && <StoreCatalog cardClass={cardClass} itens={itens} categorias={categorias} excluirItem={excluirItem} navigateToCardapio={() => navigate(`/cardapio/${store.id}`)} />}
        {aba === 'publicacoes' && <StorePublications cardClass={cardClass} publicacoes={publicacoes} excluirPublicacao={excluirPublicacao} />}
      </div>
    </div>
  );
}
