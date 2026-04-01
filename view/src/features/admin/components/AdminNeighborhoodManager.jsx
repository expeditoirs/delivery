import { useMemo, useState } from 'react';
import AdminPanelSection from './AdminPanelSection';

export default function AdminNeighborhoodManager({ bairros, busyKey, cidades, createBairro, deleteBairro }) {
  const [bairroNome, setBairroNome] = useState('');
  const [cidadeId, setCidadeId] = useState('');

  const bairrosOrdenados = useMemo(
    () => [...(bairros || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [bairros],
  );

  async function handleCreateBairro(event) {
    event.preventDefault();
    if (!bairroNome.trim() || !cidadeId) return;

    const result = await createBairro({
      nome: bairroNome.trim(),
      id_cidade: Number(cidadeId),
    });

    if (result.ok) {
      setBairroNome('');
    }
  }

  async function handleDeleteBairro(bairro) {
    const confirmed = window.confirm(`Excluir o bairro ${bairro.nome}?`);
    if (!confirmed) return;
    await deleteBairro(bairro.id);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Cadastrar bairro</h2>
        <p className="mt-1 text-sm text-slate-500">Adicione bairros novos e mantenha a cobertura de entrega organizada.</p>
        <form className="mt-4 space-y-3" onSubmit={handleCreateBairro}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cidade</label>
            <select
              value={cidadeId}
              onChange={(event) => setCidadeId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400"
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map((cidade) => (
                <option key={cidade.id} value={cidade.id}>
                  {cidade.nome} - {cidade.uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bairro</label>
            <input
              value={bairroNome}
              onChange={(event) => setBairroNome(event.target.value)}
              placeholder="Ex.: Centro"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400"
            />
          </div>
          <button
            type="submit"
            disabled={busyKey === 'bairro:create' || !bairroNome.trim() || !cidadeId}
            className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyKey === 'bairro:create' ? 'Cadastrando...' : 'Cadastrar bairro'}
          </button>
        </form>
      </section>

      <AdminPanelSection
        title="Bairros cadastrados"
        items={bairrosOrdenados}
        emptyMessage="Nenhum bairro cadastrado."
        renderItem={(item) => {
          const deleteBusy = busyKey === `bairro:${item.id}`;
          return (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.nome}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.cidade_nome || 'Cidade nao informada'}{item.cidade_uf ? ` - ${item.cidade_uf}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBairro(item)}
                disabled={deleteBusy}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteBusy ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}