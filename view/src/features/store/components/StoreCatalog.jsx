import { money } from './storeUtils';

export default function StoreCatalog({ cardClass, itens, categorias, excluirItem, navigateToCardapio }) {
  return (
    <div className={`${cardClass} space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Catálogo da loja</h2>
          <p className="text-sm text-gray-400 mt-1">Veja os produtos cadastrados e remova itens quando necessário.</p>
        </div>
        <button onClick={navigateToCardapio} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">Ver vitrine</button>
      </div>
      <div className="space-y-3">
        {itens.map((item) => {
          const config = item.configuracao || {};
          const tamanhos = config.tamanhos || [];
          const adicionais = config.adicionais || [];
          const grupos = config.grupos_opcoes || [];
          return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 break-words">{item.nome}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.descricao || 'Sem descrição'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.id_categoria && <span className="px-2 py-1 rounded-full bg-white border text-xs font-semibold text-gray-600">{categorias.find((c) => c.id === item.id_categoria)?.nome || `Categoria #${item.id_categoria}`}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-500">
                    {!tamanhos.length ? money(item.preco) : (() => {
                      const precos = tamanhos.map((t) => Number(t.preco || 0));
                      const min = Math.min(...precos);
                      const max = Math.max(...precos);
                      return min === max ? money(min) : `${money(min)} até ${money(max)}`;
                    })()}
                  </p>
                  <button onClick={() => excluirItem(item.id)} className="mt-2 text-xs font-semibold text-red-500">Excluir</button>
                </div>
              </div>
              {(tamanhos.length > 0 || adicionais.length > 0 || grupos.length > 0) && (
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white border border-gray-100 p-3"><p className="text-xs font-bold text-gray-700 mb-2">Tamanhos</p>{tamanhos.length ? <div className="space-y-1">{tamanhos.map((t, i) => <p key={i} className="text-xs text-gray-500">{t.nome} — {money(t.preco)}</p>)}</div> : <p className="text-xs text-gray-400">Sem tamanhos</p>}</div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-3"><p className="text-xs font-bold text-gray-700 mb-2">Adicionais</p>{adicionais.length ? <div className="space-y-1">{adicionais.map((a, i) => <p key={i} className="text-xs text-gray-500">{a.nome} — {money(a.preco)}</p>)}</div> : <p className="text-xs text-gray-400">Sem adicionais</p>}</div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-3"><p className="text-xs font-bold text-gray-700 mb-2">Grupos</p>{grupos.length ? <div className="space-y-1">{grupos.map((g, i) => <p key={i} className="text-xs text-gray-500">{g.nome} — min {g.min} / max {g.max}{g.tipo_grupo === 'sabores' ? ` • ${g.regra_preco === 'maior_preco' ? 'maior preço' : 'soma proporcional'}` : ''}</p>)}</div> : <p className="text-xs text-gray-400">Sem grupos</p>}</div>
                </div>
              )}
            </div>
          );
        })}
        {!itens.length && <div className="text-sm text-gray-400">Nenhum item cadastrado ainda.</div>}
      </div>
    </div>
  );
}
