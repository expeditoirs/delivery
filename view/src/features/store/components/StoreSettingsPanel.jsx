import { useMemo, useState } from 'react';
import { STORE_CATEGORY_OPTIONS, getStoreCategories } from '../../../utils/storeCategories';
import {
  STORE_STATUS_OPTIONS,
  buildStoreConfig,
  buildStoreHoursSummary,
  createStoreSchedule,
  getDeliveryFee,
  getStoreManualStatus,
  getStoreOperationalSnapshot,
  getStorePauseUntil,
  getStoreSchedule,
} from './storeUtils';

function buildInitialForm(empresa) {
  return {
    nome_empresa: empresa?.nome_empresa || '',
    categoria_empresa: empresa?.categoria_empresa || '',
    categorias_empresa: getStoreCategories(empresa),
    categoria_customizada: '',
    endereco: empresa?.endereco || '',
    numero: empresa?.numero || '',
    horarios_funcionamento: empresa?.horarios_funcionamento || '',
    taxa_entrega: String(getDeliveryFee(empresa) || ''),
    store_schedule: getStoreSchedule(empresa),
    store_status_override: getStoreManualStatus(empresa),
    store_pause_until: getStorePauseUntil(empresa) || null,
  };
}

function formatPauseDate(value) {
  if (!value) return 'Sem pausa ativa';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem pausa ativa';
  return `Pausada ate ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function StoreSettingsPanel({
  empresa,
  onSave,
  saving,
  cardClass,
  inputClass,
  labelClass,
  mode = 'all',
}) {
  const [form, setForm] = useState(() => buildInitialForm(empresa));

  const categoriasSelecionadas = useMemo(
    () => form.categorias_empresa.filter(Boolean),
    [form.categorias_empresa],
  );

  const operationalPreview = useMemo(
    () => getStoreOperationalSnapshot({ ...empresa, config_gerais: buildStoreConfig(empresa, {
      store_schedule: form.store_schedule,
      store_status_override: form.store_status_override,
      store_pause_until: form.store_pause_until,
    }) }),
    [empresa, form.store_pause_until, form.store_schedule, form.store_status_override],
  );

  const showBusiness = mode === 'all' || mode === 'business';
  const showHours = mode === 'all' || mode === 'hours';

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategoria(categoria) {
    setForm((prev) => {
      const exists = prev.categorias_empresa.includes(categoria);
      const categorias_empresa = exists
        ? prev.categorias_empresa.filter((item) => item !== categoria)
        : [...prev.categorias_empresa, categoria];

      return {
        ...prev,
        categorias_empresa,
        categoria_empresa: categorias_empresa[0] || '',
      };
    });
  }

  function addCustomCategory() {
    const novaCategoria = form.categoria_customizada.trim();
    if (!novaCategoria) return;

    setForm((prev) => {
      if (prev.categorias_empresa.includes(novaCategoria)) {
        return { ...prev, categoria_customizada: '' };
      }
      const categorias_empresa = [...prev.categorias_empresa, novaCategoria];
      return {
        ...prev,
        categorias_empresa,
        categoria_empresa: categorias_empresa[0] || '',
        categoria_customizada: '',
      };
    });
  }

  function removeCategory(categoria) {
    setForm((prev) => {
      const categorias_empresa = prev.categorias_empresa.filter((item) => item !== categoria);
      return {
        ...prev,
        categorias_empresa,
        categoria_empresa: categorias_empresa[0] || '',
      };
    });
  }

  function updateScheduleDay(index, field, value) {
    setForm((prev) => {
      const nextSchedule = [...prev.store_schedule];
      nextSchedule[index] = {
        ...nextSchedule[index],
        [field]: value,
      };
      return { ...prev, store_schedule: nextSchedule };
    });
  }

  function toggleScheduleDay(index) {
    setForm((prev) => {
      const nextSchedule = [...prev.store_schedule];
      const current = nextSchedule[index];
      const active = !current.ativo;
      nextSchedule[index] = {
        ...current,
        ativo: active,
        abertura: active ? current.abertura : '',
        fechamento: active ? current.fechamento : '',
      };
      return { ...prev, store_schedule: nextSchedule };
    });
  }

  function copyFirstScheduleToAll() {
    const source = form.store_schedule.find((item) => item.ativo && item.abertura && item.fechamento);
    if (!source) return;
    setForm((prev) => ({
      ...prev,
      store_schedule: prev.store_schedule.map((item) => ({
        ...item,
        ativo: true,
        abertura: source.abertura,
        fechamento: source.fechamento,
      })),
    }));
  }

  function resetSchedule() {
    setForm((prev) => ({
      ...prev,
      store_schedule: createStoreSchedule(),
      store_status_override: 'auto',
      store_pause_until: null,
    }));
  }

  function setPauseMinutes(minutes) {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setForm((prev) => ({
      ...prev,
      store_status_override: 'auto',
      store_pause_until: until,
    }));
  }

  function clearPause() {
    setForm((prev) => ({ ...prev, store_pause_until: null }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave?.({
      nome_empresa: form.nome_empresa,
      categoria_empresa: categoriasSelecionadas[0] || '',
      categorias_empresa: categoriasSelecionadas,
      endereco: form.endereco,
      numero: form.numero,
      horarios_funcionamento: showHours ? buildStoreHoursSummary(form.store_schedule) : form.horarios_funcionamento,
      config_gerais: buildStoreConfig(empresa, {
        taxa_entrega: Number(form.taxa_entrega || 0),
        store_schedule: form.store_schedule,
        store_status_override: form.store_status_override,
        store_pause_until: form.store_pause_until,
      }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-6`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {showHours && !showBusiness ? 'Horario da loja' : 'Configuracoes'}
        </p>
        <h2 className="mt-2 text-lg font-black text-slate-900">
          {showHours && !showBusiness ? 'Controle real de abertura da operacao' : 'Dados da loja e operacao'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {showHours && !showBusiness
            ? 'Defina agenda semanal, force aberto ou fechado quando precisar e pause a loja por 30 minutos em poucos cliques.'
            : 'Ajuste identidade da loja, categorias atendidas, taxa de entrega e dados principais da operacao.'}
        </p>
      </div>

      {showBusiness && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelClass}>Nome da loja</label>
              <input value={form.nome_empresa} onChange={(e) => updateField('nome_empresa', e.target.value)} className={inputClass} placeholder="Ex: Pizza Prime" required />
            </div>
            <div>
              <label className={labelClass}>Categoria principal</label>
              <input value={categoriasSelecionadas[0] || ''} className={`${inputClass} bg-slate-50`} placeholder="Selecione abaixo" readOnly />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-4 space-y-4">
            <div>
              <label className={labelClass}>Categorias atendidas</label>
              <p className="mt-1 text-sm text-slate-500">Marque uma ou mais categorias. A primeira selecionada vira a categoria principal da loja.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {STORE_CATEGORY_OPTIONS.map((categoria) => {
                const selected = categoriasSelecionadas.includes(categoria);
                return (
                  <button key={categoria} type="button" onClick={() => toggleCategoria(categoria)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selected ? 'bg-[linear-gradient(135deg,#f97316,#ef4444)] text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)]' : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}>
                    {categoria}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input value={form.categoria_customizada} onChange={(e) => updateField('categoria_customizada', e.target.value)} className={inputClass} placeholder="Adicionar categoria personalizada" />
              <button type="button" onClick={addCustomCategory} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-500">
                Adicionar categoria
              </button>
            </div>

            {!!categoriasSelecionadas.length && (
              <div className="flex flex-wrap gap-2">
                {categoriasSelecionadas.map((categoria, index) => (
                  <span key={categoria} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${index === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'}`}>
                    {categoria}
                    {index === 0 && <span className="text-[11px] uppercase tracking-[0.18em]">Principal</span>}
                    <button type="button" onClick={() => removeCategory(categoria)} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs text-current" aria-label={`Remover ${categoria}`}>
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_160px_180px]">
            <div>
              <label className={labelClass}>Endereco</label>
              <input value={form.endereco} onChange={(e) => updateField('endereco', e.target.value)} className={inputClass} placeholder="Rua, avenida ou praca" />
            </div>
            <div>
              <label className={labelClass}>Numero</label>
              <input value={form.numero} onChange={(e) => updateField('numero', e.target.value)} className={inputClass} placeholder="123" />
            </div>
            <div>
              <label className={labelClass}>Taxa de entrega</label>
              <input type="number" min="0" step="0.01" value={form.taxa_entrega} onChange={(e) => updateField('taxa_entrega', e.target.value)} className={inputClass} placeholder="0,00" />
            </div>
          </div>
        </>
      )}

      {showHours && (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-4 space-y-4">
              <div>
                <label className={labelClass}>Estado da loja</label>
                <p className="mt-1 text-sm text-slate-500">Escolha se a operacao segue automaticamente o horario ou se fica aberta/fechada manualmente.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {STORE_STATUS_OPTIONS.map((option) => {
                  const active = form.store_status_override === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('store_status_override', option.value)}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${active ? 'border-orange-300 bg-orange-50 shadow-[0_16px_30px_rgba(249,115,22,0.12)]' : 'border-slate-200 bg-white hover:border-orange-200'}`}
                    >
                      <p className="text-sm font-bold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{option.helper}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Pausa rapida da loja</p>
                    <p className="mt-1 text-xs text-slate-500">Use quando a cozinha atrasar, faltar entregador ou voce precisar segurar pedidos por um tempo.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPauseMinutes(30)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Pausar 30 min</button>
                    <button type="button" onClick={clearPause} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Remover pausa</button>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-amber-700">{formatPauseDate(form.store_pause_until)}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#fff7ed,#ffffff)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preview operacional</p>
              <div className="mt-4 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${operationalPreview.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : operationalPreview.tone === 'amber' ? 'bg-amber-100 text-amber-700' : operationalPreview.tone === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                  {operationalPreview.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{operationalPreview.detail}</p>
              <div className="mt-4 rounded-3xl border border-white/70 bg-white/90 p-4 text-sm leading-6 text-slate-600">
                {buildStoreHoursSummary(form.store_schedule)}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className={labelClass}>Agenda semanal</label>
                <p className="mt-1 text-sm text-slate-500">Ative os dias de funcionamento e defina abertura e fechamento de cada um.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyFirstScheduleToAll} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Repetir em todos</button>
                <button type="button" onClick={resetSchedule} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">Limpar agenda</button>
              </div>
            </div>

            <div className="space-y-3">
              {form.store_schedule.map((dia, index) => (
                <div key={dia.dia} className={`rounded-3xl border p-4 transition ${dia.ativo ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={dia.ativo} onChange={() => toggleScheduleDay(index)} className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                      <div>
                        <p className="font-bold text-slate-900">{dia.label}</p>
                        <p className="text-xs text-slate-500">{dia.ativo ? 'Funcionando neste dia' : 'Loja fechada neste dia'}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <div>
                        <label className={labelClass}>Abertura</label>
                        <input type="time" value={dia.abertura || ''} disabled={!dia.ativo} onChange={(e) => updateScheduleDay(index, 'abertura', e.target.value)} className={`${inputClass} ${!dia.ativo ? 'cursor-not-allowed opacity-60' : ''}`} />
                      </div>
                      <div>
                        <label className={labelClass}>Fechamento</label>
                        <input type="time" value={dia.fechamento || ''} disabled={!dia.ativo} onChange={(e) => updateScheduleDay(index, 'fechamento', e.target.value)} className={`${inputClass} ${!dia.ativo ? 'cursor-not-allowed opacity-60' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="rounded-[20px] bg-[linear-gradient(135deg,#f97316,#ef4444)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(249,115,22,0.28)] disabled:opacity-60">
          {saving ? 'Salvando...' : showHours && !showBusiness ? 'Salvar horario da loja' : 'Salvar dados da loja'}
        </button>
      </div>
    </form>
  );
}
