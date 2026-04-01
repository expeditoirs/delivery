import {
  applyProductPreset,
  EMPTY_GROUP,
  EMPTY_OPTION,
  EMPTY_SIZE,
  PRODUCT_PRESETS,
} from './storeUtils';
import LojaHours from '../../../pages/store/LojaHours';

function numberValue(value) {
  return value === '' ? '' : Number(value);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StoreProductForm({
  form,
  setForm,
  categorias,
  cadastrarItem,
  resetForm,
  salvando,
  cardClass,
  inputClass,
  labelClass,
}) {
  const usaTamanhos = form.tipo_produto === 'pizza' || Boolean(form.usar_tamanhos);

  function updateForm(field, value) {
    if (field === 'tipo_produto') {
      setForm((prev) => ({
        ...prev,
        tipo_produto: value,
        usar_tamanhos: value === 'pizza' ? true : value === 'normal' ? false : prev.usar_tamanhos,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSize() {
    setForm((prev) => ({ ...prev, tamanhos: [...prev.tamanhos, { ...EMPTY_SIZE }] }));
  }

  function updateSize(index, field, value) {
    setForm((prev) => ({
      ...prev,
      tamanhos: prev.tamanhos.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      grupos_opcoes: prev.grupos_opcoes.map((grupo) => ({
        ...grupo,
        itens: (grupo.itens || []).map((item) => ({
          ...item,
          precos_por_tamanho: field === 'nome' && grupo.tipo_grupo === 'sabores'
            ? Object.fromEntries(
                Object.entries(item.precos_por_tamanho || {}).map(([key, price]) => [key === prev.tamanhos[index]?.nome ? value : key, price])
              )
            : item.precos_por_tamanho || {},
        })),
      })),
    }));
  }

  function removeSize(index) {
    const sizeName = form.tamanhos[index]?.nome;
    setForm((prev) => ({
      ...prev,
      tamanhos: prev.tamanhos.filter((_, i) => i !== index),
      grupos_opcoes: prev.grupos_opcoes.map((grupo) => ({
        ...grupo,
        itens: (grupo.itens || []).map((item) => {
          const nextPrices = { ...(item.precos_por_tamanho || {}) };
          if (sizeName) delete nextPrices[sizeName];
          return { ...item, precos_por_tamanho: nextPrices };
        }),
      })),
    }));
  }

  function addAdicional() {
    setForm((prev) => ({ ...prev, adicionais: [...prev.adicionais, { ...EMPTY_OPTION }] }));
  }

  function updateAdicional(index, field, value) {
    setForm((prev) => ({
      ...prev,
      adicionais: prev.adicionais.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function removeAdicional(index) {
    setForm((prev) => ({ ...prev, adicionais: prev.adicionais.filter((_, i) => i !== index) }));
  }

  function addGrupo() {
    setForm((prev) => ({ ...prev, grupos_opcoes: [...prev.grupos_opcoes, { ...EMPTY_GROUP, itens: [] }] }));
  }

  function updateGrupo(index, field, value) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) => (i === index ? { ...grupo, [field]: value } : grupo)),
    }));
  }

  function removeGrupo(index) {
    setForm((prev) => ({ ...prev, grupos_opcoes: prev.grupos_opcoes.filter((_, i) => i !== index) }));
  }

  function addItemGrupo(groupIndex) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) =>
        i === groupIndex ? { ...grupo, itens: [...grupo.itens, { ...EMPTY_OPTION }] } : grupo
      ),
    }));
  }

  function updateItemGrupo(groupIndex, itemIndex, field, value) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) =>
        i === groupIndex
          ? {
              ...grupo,
              itens: grupo.itens.map((item, j) => (j === itemIndex ? { ...item, [field]: value } : item)),
            }
          : grupo
      ),
    }));
  }

  function updateItemGrupoPrecoTamanho(groupIndex, itemIndex, sizeName, value) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) =>
        i === groupIndex
          ? {
              ...grupo,
              itens: grupo.itens.map((item, j) =>
                j === itemIndex
                  ? {
                      ...item,
                      precos_por_tamanho: {
                        ...(item.precos_por_tamanho || {}),
                        [sizeName]: value,
                      },
                    }
                  : item
              ),
            }
          : grupo
      ),
    }));
  }

  function removeItemGrupo(groupIndex, itemIndex) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) =>
        i === groupIndex ? { ...grupo, itens: grupo.itens.filter((_, j) => j !== itemIndex) } : grupo
      ),
    }));
  }

  async function handleImagemChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((prev) => ({ ...prev, imagemFile: null, imagemPreview: '', imagemDataUrl: '' }));
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, imagemFile: file, imagemPreview: dataUrl, imagemDataUrl: dataUrl }));
  }

  function applyPreset(presetKey) {
    setForm((prev) => applyProductPreset(presetKey, prev));
  }

  return (
    <form onSubmit={cadastrarItem} className={`${cardClass} space-y-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Novo produto</h2>
          <p className="mt-1 text-sm text-slate-500">Cadastre itens com estrutura pronta para delivery, imagem e disponibilidade.</p>
        </div>
        <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500">Limpar</button>
      </div>

      <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-orange-900">Presets de montagem</h3>
            <p className="mt-1 text-sm text-orange-700">Atalhos prontos para cadastrar mais rapido no padrao do delivery.</p>
          </div>
          <button type="button" onClick={resetForm} className="text-sm font-semibold text-orange-700">Comecar do zero</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {PRODUCT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                form.nome === applyProductPreset(preset.key, form).nome
                  ? 'border-orange-300 bg-white shadow-sm'
                  : 'border-orange-200 bg-white/70 hover:bg-white'
              }`}
            >
              <p className="font-semibold text-slate-900">{preset.label}</p>
              <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>Tipo de produto</label>
              <select value={form.tipo_produto} onChange={(e) => updateForm('tipo_produto', e.target.value)} className={inputClass}>
                <option value="normal">Produto comum</option>
                <option value="acai">Produto por tamanho</option>
                <option value="pizza">Pizza / sabores</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Categoria do produto</label>
              <select value={form.id_categoria} onChange={(e) => updateForm('id_categoria', e.target.value)} className={inputClass} required>
                <option value="">Selecione a categoria</option>
                {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Nome do produto</label>
            <input value={form.nome} onChange={(e) => updateForm('nome', e.target.value)} required placeholder="Ex: Pizza meio a meio, Acai 500ml, Refrigerante 2L" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Descricao</label>
            <textarea value={form.descricao} onChange={(e) => updateForm('descricao', e.target.value)} rows={4} placeholder="Descreva o produto, os diferenciais e opcoes disponiveis." className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
          <div>
            <label className={labelClass}>Imagem do produto</label>
            <input type="file" accept="image/*" onChange={handleImagemChange} className={inputClass} />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-dashed border-slate-200 bg-slate-50">
            {form.imagemPreview ? (
              <img src={form.imagemPreview} alt="Previa" className="h-[260px] w-full object-cover" />
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center px-8 text-center text-slate-400">
                <span className="material-icons text-5xl">photo_camera</span>
                <p className="mt-3 text-sm font-semibold">A imagem ajuda na decisao de compra</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">Estrutura de preco</p>
            <p className="mt-1 text-sm text-blue-700">Use preco fixo para produtos simples ou tamanhos para catalogos variaveis.</p>
          </div>
          {form.tipo_produto !== 'pizza' && (
            <label className="flex items-center gap-2 text-sm text-blue-900">
              <input type="checkbox" checked={Boolean(form.usar_tamanhos)} onChange={(e) => updateForm('usar_tamanhos', e.target.checked)} />
              Trabalhar com tamanhos
            </label>
          )}
        </div>

        {!usaTamanhos && (
          <div>
            <label className={labelClass}>Preco fixo</label>
            <input type="number" step="0.01" min="0" value={form.preco_fixo} onChange={(e) => updateForm('preco_fixo', e.target.value)} placeholder="0,00" className={inputClass} />
          </div>
        )}

        {form.tipo_produto === 'pizza' && (
          <div className="rounded-2xl border border-orange-200 bg-white p-3 text-sm text-slate-700">
            A pizza usa tamanhos e a regra de preco dos sabores. Em cada tamanho voce pode definir quantos sabores o cliente pode montar.
          </div>
        )}
      </div>

      <LojaHours
        form={form}
        setForm={setForm}
        cardClass="rounded-[28px] border border-slate-100 bg-white p-4"
        inputClass={inputClass}
        labelClass={labelClass}
      />

      {usaTamanhos && (
        <section className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Tamanhos e precos</h3>
              <p className="mt-1 text-sm text-slate-500">Use para pizza, acai, bebidas, combos e outros produtos.</p>
            </div>
            <button type="button" onClick={addSize} className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">+ Adicionar tamanho</button>
          </div>

          {!form.tamanhos.length && <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Nenhum tamanho adicionado ainda.</div>}

          <div className="space-y-3">
            {form.tamanhos.map((tamanho, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className={`grid gap-3 ${form.tipo_produto === 'pizza' ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
                  <div>
                    <label className={labelClass}>Nome do tamanho</label>
                    <input value={tamanho.nome} onChange={(e) => updateSize(index, 'nome', e.target.value)} placeholder="Ex: Pequena, Media, Grande" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Preco base</label>
                    <input type="number" step="0.01" min="0" value={tamanho.preco} onChange={(e) => updateSize(index, 'preco', e.target.value)} placeholder="0,00" className={inputClass} />
                  </div>
                  {form.tipo_produto === 'pizza' && (
                    <>
                      <div>
                        <label className={labelClass}>Min. sabores</label>
                        <input type="number" min="1" value={numberValue(tamanho.min_sabores)} onChange={(e) => updateSize(index, 'min_sabores', e.target.value)} placeholder="1" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Max. sabores</label>
                        <input type="number" min="1" value={numberValue(tamanho.max_sabores)} onChange={(e) => updateSize(index, 'max_sabores', e.target.value)} placeholder="2" className={inputClass} />
                      </div>
                    </>
                  )}
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeSize(index)} className="w-full rounded-xl border border-red-200 px-3 py-3 font-semibold text-red-500">Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Adicionais</h3>
            <p className="mt-1 text-sm text-slate-500">Complementos cobrados a parte, como borda, granola, queijo extra.</p>
          </div>
          <button type="button" onClick={addAdicional} className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">+ Adicionar adicional</button>
        </div>

        {!form.adicionais.length && <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Nenhum adicional adicionado ainda.</div>}
        <div className="space-y-3">
          {form.adicionais.map((adicional, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Nome do adicional</label>
                  <input value={adicional.nome} onChange={(e) => updateAdicional(index, 'nome', e.target.value)} placeholder="Ex: Catupiry extra" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Preco</label>
                  <input type="number" step="0.01" min="0" value={adicional.preco} onChange={(e) => updateAdicional(index, 'preco', e.target.value)} placeholder="0,00" className={inputClass} />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeAdicional(index)} className="w-full rounded-xl border border-red-200 px-3 py-3 font-semibold text-red-500">Remover</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-100 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Grupos de opcoes</h3>
            <p className="mt-1 text-sm text-slate-500">Use para sabores, massas, caldas, acompanhamentos e recheios.</p>
          </div>
          <button type="button" onClick={addGrupo} className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">+ Adicionar grupo</button>
        </div>

        {!form.grupos_opcoes.length && <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Nenhum grupo adicionado ainda.</div>}

        <div className="space-y-4">
          {form.grupos_opcoes.map((grupo, groupIndex) => (
            <div key={groupIndex} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Nome do grupo</label>
                  <input value={grupo.nome} onChange={(e) => updateGrupo(groupIndex, 'nome', e.target.value)} placeholder="Ex: Sabores, Caldas, Acompanhamentos" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipo do grupo</label>
                  <select value={grupo.tipo_grupo} onChange={(e) => updateGrupo(groupIndex, 'tipo_grupo', e.target.value)} className={inputClass}>
                    <option value="opcoes">Opcoes comuns</option>
                    <option value="sabores">Grupo de sabores</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className={labelClass}>Minimo</label>
                  <input type="number" min="0" value={numberValue(grupo.min)} onChange={(e) => updateGrupo(groupIndex, 'min', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Maximo</label>
                  <input type="number" min="1" value={numberValue(grupo.max)} onChange={(e) => updateGrupo(groupIndex, 'max', e.target.value)} className={inputClass} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={grupo.obrigatorio} onChange={(e) => updateGrupo(groupIndex, 'obrigatorio', e.target.checked)} />
                    Obrigatorio
                  </label>
                </div>
                <div className="flex items-end">
                  {grupo.tipo_grupo === 'sabores' ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={grupo.divisivel} onChange={(e) => updateGrupo(groupIndex, 'divisivel', e.target.checked)} />
                      Permite meio a meio
                    </label>
                  ) : (
                    <div className="text-sm text-slate-400">Grupo comum</div>
                  )}
                </div>
              </div>

              {grupo.tipo_grupo === 'sabores' && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Regra de preco</label>
                      <select value={grupo.regra_preco} onChange={(e) => updateGrupo(groupIndex, 'regra_preco', e.target.value)} className={inputClass}>
                        <option value="maior_preco">Sabor mais caro define o preco</option>
                        <option value="soma_proporcional">Divide pelos sabores e soma</option>
                      </select>
                    </div>
                    <div className="flex items-end text-sm text-slate-600">
                      Para pizza, voce pode informar precos diferentes por tamanho em cada sabor.
                    </div>
                  </div>
                </div>
              )}

              {!grupo.itens.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">Nenhum item no grupo ainda.</div>}
              <div className="space-y-3">
                {grupo.itens.map((item, itemIndex) => (
                  <div key={itemIndex} className="rounded-2xl border border-slate-100 bg-white p-3 space-y-3">
                    <div className={`grid gap-3 ${grupo.tipo_grupo === 'sabores' && usaTamanhos ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                      <div>
                        <label className={labelClass}>{grupo.tipo_grupo === 'sabores' ? 'Nome do sabor' : 'Nome da opcao'}</label>
                        <input value={item.nome} onChange={(e) => updateItemGrupo(groupIndex, itemIndex, 'nome', e.target.value)} placeholder={grupo.tipo_grupo === 'sabores' ? 'Ex: Calabresa' : 'Ex: Granola'} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{grupo.tipo_grupo === 'sabores' && usaTamanhos ? 'Preco fallback' : 'Preco'}</label>
                        <input type="number" step="0.01" min="0" value={item.preco} onChange={(e) => updateItemGrupo(groupIndex, itemIndex, 'preco', e.target.value)} placeholder="0,00" className={inputClass} />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeItemGrupo(groupIndex, itemIndex)} className="w-full rounded-xl border border-red-200 px-3 py-3 font-semibold text-red-500">Remover item</button>
                      </div>
                    </div>

                    {grupo.tipo_grupo === 'sabores' && usaTamanhos && form.tamanhos.length > 0 && (
                      <div className="grid gap-3 md:grid-cols-3">
                        {form.tamanhos.filter((size) => size.nome.trim()).map((size) => (
                          <div key={size.nome}>
                            <label className={labelClass}>Preco em {size.nome}</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.precos_por_tamanho?.[size.nome] || ''}
                              onChange={(e) => updateItemGrupoPrecoTamanho(groupIndex, itemIndex, size.nome, e.target.value)}
                              placeholder="0,00"
                              className={inputClass}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addItemGrupo(groupIndex)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  + Adicionar {grupo.tipo_grupo === 'sabores' ? 'sabor' : 'item'}
                </button>
                <button type="button" onClick={() => removeGrupo(groupIndex)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500">
                  Remover grupo
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" disabled={salvando} className="w-full rounded-[24px] bg-[linear-gradient(135deg,#f97316,#ef4444)] py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] disabled:opacity-60">
        {salvando ? 'Salvando produto...' : 'Cadastrar produto'}
      </button>
    </form>
  );
}