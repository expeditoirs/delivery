import {
  DIAS_SEMANA,
  EMPTY_GROUP,
  EMPTY_OPTION,
  EMPTY_SIZE,
} from './storeUtils';

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
  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSize() {
    setForm((prev) => ({ ...prev, tamanhos: [...prev.tamanhos, { ...EMPTY_SIZE }] }));
  }

  function updateSize(index, field, value) {
    setForm((prev) => ({
      ...prev,
      tamanhos: prev.tamanhos.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function removeSize(index) {
    setForm((prev) => ({ ...prev, tamanhos: prev.tamanhos.filter((_, i) => i !== index) }));
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

  function removeItemGrupo(groupIndex, itemIndex) {
    setForm((prev) => ({
      ...prev,
      grupos_opcoes: prev.grupos_opcoes.map((grupo, i) =>
        i === groupIndex ? { ...grupo, itens: grupo.itens.filter((_, j) => j !== itemIndex) } : grupo
      ),
    }));
  }

  function updateHorario(index, field, value) {
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((dia, i) => (i === index ? { ...dia, [field]: value } : dia)),
    }));
  }

  function handleImagemChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((prev) => ({ ...prev, imagemFile: null, imagemPreview: '' }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imagemFile: file, imagemPreview: preview }));
  }

  return (
    <form onSubmit={cadastrarItem} className={`${cardClass} space-y-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Novo produto</h2>
          <p className="text-sm text-gray-400 mt-1">Cadastre categoria, imagem, horários, descrição, tamanhos, adicionais e grupos.</p>
        </div>
        <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-500">Limpar</button>
      </div>

      <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
        <div>
          <label className={labelClass}>Categoria do produto</label>
          <select value={form.id_categoria} onChange={(e) => updateForm('id_categoria', e.target.value)} className={inputClass} required>
            <option value="">Selecione a categoria</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Nome do produto</label>
          <input value={form.nome} onChange={(e) => updateForm('nome', e.target.value)} required placeholder="Ex: Pizza calabresa, Açaí 500ml, Coca-Cola lata" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Imagem do produto</label>
          <input type="file" accept="image/*" onChange={handleImagemChange} className={inputClass} />
          {form.imagemPreview && <div className="mt-3"><img src={form.imagemPreview} alt="Prévia" className="w-28 h-28 object-cover rounded-2xl border border-gray-200" /></div>}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">Disponibilidade / horários</h3>
              <p className="text-sm text-gray-400 mt-1">Use texto livre ou controle por dia da semana.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.usarControleHorario} onChange={(e) => updateForm('usarControleHorario', e.target.checked)} />
              Usar controle por dia
            </label>
          </div>

          {!form.usarControleHorario ? (
            <div>
              <label className={labelClass}>Texto de disponibilidade</label>
              <input value={form.disponibilidade_horarios} onChange={(e) => updateForm('disponibilidade_horarios', e.target.value)} placeholder="Ex: 18:00 às 23:30" className={inputClass} />
            </div>
          ) : (
            <div className="space-y-3">
              {form.horarios.map((dia, index) => (
                <div key={`${DIAS_SEMANA[index]?.key || dia.dia}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-3">
                  <div className="grid md:grid-cols-4 gap-3 items-end">
                    <div><label className={labelClass}>Dia</label><div className="px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">{dia.label}</div></div>
                    <div><label className={labelClass}>Abrir</label><input type="time" value={dia.abertura} onChange={(e) => updateHorario(index, 'abertura', e.target.value)} disabled={!dia.ativo} className={inputClass} /></div>
                    <div><label className={labelClass}>Fechar</label><input type="time" value={dia.fechamento} onChange={(e) => updateHorario(index, 'fechamento', e.target.value)} disabled={!dia.ativo} className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <button type="button" onClick={() => updateHorario(index, 'ativo', !dia.ativo)} className={`w-full px-3 py-3 rounded-xl font-semibold text-sm border ${dia.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {dia.ativo ? 'Ativado' : 'Desativado'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea value={form.descricao} onChange={(e) => updateForm('descricao', e.target.value)} placeholder="Ex: Molho de tomate, mussarela e calabresa. Ou: açaí tradicional com textura cremosa." rows={4} className={`${inputClass} resize-none`} />
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm font-semibold text-blue-900">Preço do produto</p>
        <p className="text-sm text-blue-700 mt-1">O preço é definido pelos tamanhos cadastrados. Se houver apenas um tamanho, ele será o preço normal do produto.</p>
      </div>

      <section className="rounded-2xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="font-bold text-gray-900">Tamanhos e preços</h3><p className="text-sm text-gray-400 mt-1">Serve para pizza, açaí, bebidas, combos e outros produtos.</p></div><button type="button" onClick={addSize} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">+ Adicionar tamanho</button></div>
        {!form.tamanhos.length && <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">Nenhum tamanho adicionado ainda.</div>}
        <div className="space-y-3">{form.tamanhos.map((tamanho, index) => <div key={index} className="rounded-2xl border border-gray-100 p-3 bg-gray-50"><div className="grid md:grid-cols-3 gap-3"><div><label className={labelClass}>Nome do tamanho</label><input value={tamanho.nome} onChange={(e) => updateSize(index, 'nome', e.target.value)} placeholder="Ex: 300ml, 500ml, Pequeno, Grande" className={inputClass} /></div><div><label className={labelClass}>Preço</label><input type="number" step="0.01" value={tamanho.preco} onChange={(e) => updateSize(index, 'preco', e.target.value)} placeholder="0,00" className={inputClass} /></div><div className="flex items-end"><button type="button" onClick={() => removeSize(index)} className="w-full px-3 py-3 rounded-xl border border-red-200 text-red-500 font-semibold">Remover</button></div></div></div>)}</div>
      </section>

      <section className="rounded-2xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="font-bold text-gray-900">Adicionais</h3><p className="text-sm text-gray-400 mt-1">Cadastre complementos cobrados à parte.</p></div><button type="button" onClick={addAdicional} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">+ Adicionar adicional</button></div>
        {!form.adicionais.length && <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">Nenhum adicional adicionado ainda.</div>}
        <div className="space-y-3">{form.adicionais.map((adicional, index) => <div key={index} className="rounded-2xl border border-gray-100 p-3 bg-gray-50"><div className="grid md:grid-cols-3 gap-3"><div><label className={labelClass}>Nome do adicional</label><input value={adicional.nome} onChange={(e) => updateAdicional(index, 'nome', e.target.value)} placeholder="Ex: Catupiry extra, granola, chantilly" className={inputClass} /></div><div><label className={labelClass}>Preço</label><input type="number" step="0.01" value={adicional.preco} onChange={(e) => updateAdicional(index, 'preco', e.target.value)} placeholder="0,00" className={inputClass} /></div><div className="flex items-end"><button type="button" onClick={() => removeAdicional(index)} className="w-full px-3 py-3 rounded-xl border border-red-200 text-red-500 font-semibold">Remover</button></div></div></div>)}</div>
      </section>

      <section className="rounded-2xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="font-bold text-gray-900">Grupos de opções</h3><p className="text-sm text-gray-400 mt-1">Use para sabores, acompanhamentos, caldas, recheios, etc.</p></div><button type="button" onClick={addGrupo} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">+ Adicionar grupo</button></div>
        {!form.grupos_opcoes.length && <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">Nenhum grupo adicionado ainda.</div>}
        <div className="space-y-4">
          {form.grupos_opcoes.map((grupo, groupIndex) => (
            <div key={groupIndex} className="rounded-2xl border border-gray-100 p-4 bg-gray-50 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className={labelClass}>Nome do grupo</label><input value={grupo.nome} onChange={(e) => updateGrupo(groupIndex, 'nome', e.target.value)} placeholder="Ex: Sabores, Caldas, Acompanhamentos" className={inputClass} /></div>
                <div><label className={labelClass}>Tipo do grupo</label><select value={grupo.tipo_grupo} onChange={(e) => updateGrupo(groupIndex, 'tipo_grupo', e.target.value)} className={inputClass}><option value="opcoes">Opções comuns</option><option value="sabores">Grupo de sabores</option></select></div>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div><label className={labelClass}>Mínimo</label><input type="number" min="0" value={grupo.min} onChange={(e) => updateGrupo(groupIndex, 'min', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Máximo</label><input type="number" min="1" value={grupo.max} onChange={(e) => updateGrupo(groupIndex, 'max', e.target.value)} className={inputClass} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={grupo.obrigatorio} onChange={(e) => updateGrupo(groupIndex, 'obrigatorio', e.target.checked)} />Obrigatório</label></div>
                <div className="flex items-end">{grupo.tipo_grupo === 'sabores' ? <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={grupo.divisivel} onChange={(e) => updateGrupo(groupIndex, 'divisivel', e.target.checked)} />Divisível</label> : <div className="text-sm text-gray-400">Grupo comum</div>}</div>
              </div>
              {grupo.tipo_grupo === 'sabores' && <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4"><div className="grid md:grid-cols-2 gap-3"><div><label className={labelClass}>Regra de preço</label><select value={grupo.regra_preco} onChange={(e) => updateGrupo(groupIndex, 'regra_preco', e.target.value)} className={inputClass}><option value="maior_preco">Sabor mais caro define o preço</option><option value="soma_proporcional">Soma proporcional dos sabores</option></select></div><div className="flex items-end"><div className="text-sm text-gray-600">Ex.: para 2 sabores, o cliente pode escolher até 2 itens desse grupo.</div></div></div></div>}
              {!grupo.itens.length && <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 bg-white">Nenhum item no grupo ainda.</div>}
              <div className="space-y-3">{grupo.itens.map((item, itemIndex) => <div key={itemIndex} className="grid md:grid-cols-3 gap-3 bg-white rounded-2xl border border-gray-100 p-3"><div><label className={labelClass}>{grupo.tipo_grupo === 'sabores' ? 'Nome do sabor' : 'Nome da opção'}</label><input value={item.nome} onChange={(e) => updateItemGrupo(groupIndex, itemIndex, 'nome', e.target.value)} placeholder={grupo.tipo_grupo === 'sabores' ? 'Ex: Calabresa' : 'Ex: Granola'} className={inputClass} /></div><div><label className={labelClass}>Preço</label><input type="number" step="0.01" value={item.preco} onChange={(e) => updateItemGrupo(groupIndex, itemIndex, 'preco', e.target.value)} placeholder="0,00" className={inputClass} /></div><div className="flex items-end"><button type="button" onClick={() => removeItemGrupo(groupIndex, itemIndex)} className="w-full px-3 py-3 rounded-xl border border-red-200 text-red-500 font-semibold">Remover item</button></div></div>)}</div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => addItemGrupo(groupIndex)} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm">+ Adicionar {grupo.tipo_grupo === 'sabores' ? 'sabor' : 'item'}</button><button type="button" onClick={() => removeGrupo(groupIndex)} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 font-semibold text-sm">Remover grupo</button></div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" disabled={salvando} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-60">{salvando ? 'Salvando produto...' : 'Cadastrar produto'}</button>
    </form>
  );
}
