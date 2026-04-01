import { money } from './storeUtils';
import { formatStoreCategories } from '../../../utils/storeCategories';

export default function StoreSummary({ empresa, itens, totalCatalogo, categoriaSelecionada, publicacoesCount, cardClass }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={cardClass}>
        <p className="text-xs text-gray-400">Loja</p>
        <p className="font-bold text-gray-900 mt-1 break-words">{empresa?.nome_empresa}</p>
        <p className="text-xs text-gray-500 mt-1">{formatStoreCategories(empresa, 'Categoria nao definida')}</p>
      </div>
      <div className={cardClass}>
        <p className="text-xs text-gray-400">Itens cadastrados</p>
        <p className="font-bold text-gray-900 mt-1">{itens.length}</p>
        <p className="text-xs text-gray-500 mt-1">Base: {money(totalCatalogo)}</p>
      </div>
      <div className={cardClass}>
        <p className="text-xs text-gray-400">Categoria atual do cadastro</p>
        <p className="font-bold text-gray-900 mt-1">{categoriaSelecionada?.nome || 'Nenhuma selecionada'}</p>
      </div>
      <div className={cardClass}>
        <p className="text-xs text-gray-400">Publicacoes citando a loja</p>
        <p className="font-bold text-gray-900 mt-1">{publicacoesCount}</p>
        <p className="text-xs text-gray-500 mt-1">Monitoramento da vitrine</p>
      </div>
    </div>
  );
}