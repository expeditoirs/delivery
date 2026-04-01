import { useMemo, useState } from 'react';
import { money } from './storeUtils';

export default function StoreCatalog({ cardClass, itens, categorias, excluirItem, onToggleAvailability, busyItemId, navigateToCardapio }) {
  const [busca, setBusca] = useState('');

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((item) =>
      String(item.nome || '').toLowerCase().includes(termo) ||
      String(item.descricao || '').toLowerCase().includes(termo)
    );
  }, [busca, itens]);

  return (
    <div className={`${cardClass} space-y-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Catalogo da loja</h2>
          <p className="mt-1 text-sm text-slate-500">Pesquise itens, acompanhe disponibilidade e entre rapido na vitrine.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar item por nome ou descricao"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button onClick={navigateToCardapio} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Abrir vitrine</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {itensFiltrados.map((item) => {
          const config = item.configuracao || {};
          const tamanhos = config.tamanhos || [];
          const adicionais = config.adicionais || [];
          const grupos = config.grupos_opcoes || [];
          const isBusy = busyItemId === item.id;
          const categoriaNome = categorias.find((c) => c.id === item.id_categoria)?.nome || (item.id_categoria ? `Categoria #${item.id_categoria}` : 'Sem categoria');
          const precoResumo = !tamanhos.length
            ? money(item.preco)
            : (() => {
                const precos = tamanhos.map((t) => Number(t.preco || 0));
                const min = Math.min(...precos);
                const max = Math.max(...precos);
                return min === max ? money(min) : `${money(min)} ate ${money(max)}`;
              })();

          return (
            <article key={item.id} className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50/90 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                <div className="relative min-h-[180px] bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(239,68,68,0.08))]">
                  {item.img ? (
                    <img src={item.img} alt={item.nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <span className="material-icons text-5xl">fastfood</span>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {categoriaNome}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{item.nome}</h3>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {item.ativo ? 'Disponivel' : 'Indisponivel'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.descricao || 'Produto sem descricao cadastrada.'}</p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Preco</p>
                      <p className="mt-1 text-base font-black text-orange-600">{precoResumo}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tamanhos</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{tamanhos.length || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Adicionais</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{adicionais.length || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Grupos</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{grupos.length || 0}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleAvailability?.(item)}
                      disabled={isBusy}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.ativo ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} disabled:opacity-60`}
                    >
                      {isBusy ? 'Salvando...' : item.ativo ? 'Marcar indisponivel' : 'Reativar item'}
                    </button>
                    <button onClick={() => excluirItem(item.id)} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100">Excluir item</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!itensFiltrados.length && (
        <div className="rounded-[28px] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
          Nenhum item encontrado para esse filtro.
        </div>
      )}
    </div>
  );
}