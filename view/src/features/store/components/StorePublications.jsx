export default function StorePublications({ cardClass, publicacoes, excluirPublicacao }) {
  return (
    <div className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="text-base font-bold text-gray-900">Publicações que citam a empresa</h2>
        <p className="text-sm text-gray-400 mt-1">Acompanhe menções e remova publicações quando necessário.</p>
      </div>
      <div className="space-y-3">
        {publicacoes.map((pub) => (
          <div key={pub.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 break-words">{pub.titulo || 'Publicação sem título'}</p>
                <p className="text-xs text-gray-400 mt-1">{pub.autor_nome || pub.usuario_nome || 'Autor não identificado'}</p>
              </div>
              <button onClick={() => excluirPublicacao(pub.id)} className="text-xs font-semibold text-red-500 shrink-0">Excluir</button>
            </div>
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{pub.conteudo || 'Sem conteúdo'}</p>
          </div>
        ))}
        {!publicacoes.length && <div className="text-sm text-gray-400">Nenhuma publicação relacionada à sua empresa foi encontrada.</div>}
      </div>
    </div>
  );
}
