import { useEffect, useMemo, useState } from 'react';
import api from '../../core/api';
import { getCurrentUser } from '../../utils/auth';
import { readFileAsDataUrl } from '../../utils/postImageCodec';
import { containsProfanity } from '../../utils/profanityFilter';
import { criarPublicacao } from '../../services/publicacoesService';

function statusElegivel(status) {
  return String(status || '').toLowerCase() === 'entregue';
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function CreatePostComposer({ isOpen, initialPedidoId = '', onClose, onCreated }) {
  const currentUser = getCurrentUser();
  const [pedidos, setPedidos] = useState([]);
  const [pedidoId, setPedidoId] = useState(initialPedidoId ? String(initialPedidoId) : '');
  const [descricao, setDescricao] = useState('');
  const [imagemPreview, setImagemPreview] = useState('');
  const [imagemPayload, setImagemPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    setPedidoId(initialPedidoId ? String(initialPedidoId) : '');
  }, [initialPedidoId, isOpen]);

  useEffect(() => {
    let active = true;
    async function loadPedidos() {
      if (!currentUser?.id || !isOpen) return;
      try {
        const { data } = await api.get(`/pedido/usuario/${currentUser.id}`, { params: { limit: 20 } });
        if (!active) return;
        setPedidos(Array.isArray(data) ? data.filter((item) => statusElegivel(item.status)) : []);
      } catch (error) {
        console.error('Erro ao carregar pedidos para publicacao:', error);
      }
    }

    loadPedidos();
    return () => {
      active = false;
    };
  }, [currentUser?.id, isOpen]);

  const pedidoSelecionado = useMemo(
    () => pedidos.find((pedido) => String(pedido.id) === String(pedidoId)) || null,
    [pedidoId, pedidos],
  );

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setImagemPreview(dataUrl);
    setImagemPayload(dataUrl);
  }

  function resetComposer() {
    setPedidoId('');
    setDescricao('');
    setImagemPreview('');
    setImagemPayload('');
    setErro('');
    setSucesso('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setSucesso('');

    if (!currentUser?.id) {
      setErro('Voce precisa estar logado para publicar.');
      return;
    }
    if (!pedidoId) {
      setErro('Selecione um pedido finalizado para publicar.');
      return;
    }
    if (!imagemPayload) {
      setErro('Escolha uma imagem para sua publicacao.');
      return;
    }
    if (containsProfanity(descricao)) {
      setErro('Remova palavroes ou ofensas antes de publicar.');
      return;
    }

    setLoading(true);
    try {
      await criarPublicacao({
        id_pedido: Number(pedidoId),
        id_usuario: currentUser.id,
        imagem_url: imagemPayload,
        descricao: descricao.trim() || 'Pedido entregue, foto oficial da felicidade.',
        aprovado: true,
      });
      setSucesso('Publicacao criada com sucesso.');
      onCreated?.();
      resetComposer();
      onClose?.();
    } catch (error) {
      console.error('Erro ao publicar no feed:', error);
      setErro(error?.response?.data?.detail || 'Nao foi possivel publicar agora.');
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_35%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] shadow-[0_22px_60px_rgba(2,6,23,0.45)]">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/55 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-lg font-black text-white shadow-inner shadow-cyan-500/10">
                {currentUser.nome?.slice(0, 1) || 'U'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">
                    Postar no social
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    So pedidos entregues
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black text-white">Transforme um pedido entregue em conteudo</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetComposer();
                onClose?.();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Pedido entregue</label>
              <select value={pedidoId} onChange={(event) => setPedidoId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-cyan-400/50">
                <option value="">Selecione um pedido finalizado</option>
                {pedidos.map((pedido) => (
                  <option key={pedido.id} value={pedido.id}>{`Pedido #${pedido.id} • ${formatCurrency(pedido.total)}`}</option>
                ))}
              </select>

              {pedidoSelecionado ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3"><p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Status</p><p className="mt-1 text-sm font-bold text-emerald-300">{pedidoSelecionado.status}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3"><p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Total</p><p className="mt-1 text-sm font-bold text-white">{formatCurrency(pedidoSelecionado.total)}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3"><p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Quando</p><p className="mt-1 text-sm font-bold text-white">{new Date(pedidoSelecionado.data_pedido).toLocaleDateString('pt-BR')}</p></div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Legenda</label>
              <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Descreva sabor, entrega, embalagem e o que realmente valeu a pena." className="min-h-40 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50" />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>Texto ofensivo ou com palavroes nao sera aceito.</span><span>{descricao.length} caracteres</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Imagem</p><p className="mt-1 text-sm text-slate-300">Use uma foto real do pedido entregue.</p></div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20"><span className="material-icons text-base">add_photo_alternate</span>{imagemPreview ? 'Trocar foto' : 'Escolher foto'}<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></label>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.82))]">
                {imagemPreview ? <img src={imagemPreview} alt="Preview" className="h-[360px] w-full object-cover" /> : <div className="flex h-[360px] flex-col items-center justify-center px-8 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-200"><span className="material-icons text-4xl">photo_camera</span></div><h3 className="mt-5 text-lg font-black text-white">Seu post com cara de app de verdade</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">A foto vira a peca principal do card. Suba uma imagem vertical ou quadrada para ficar forte no feed.</p></div>}
              </div>
            </div>

            {erro ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{erro}</div> : null}
            {sucesso ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{sucesso}</div> : null}

            <button type="submit" disabled={loading} className="w-full rounded-[24px] bg-[linear-gradient(135deg,#14b8a6,#06b6d4)] px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Publicando...' : 'Publicar agora'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}