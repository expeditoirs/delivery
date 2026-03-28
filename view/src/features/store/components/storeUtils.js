export const EMPTY_SIZE = { nome: '', preco: '' };
export const EMPTY_OPTION = { nome: '', preco: '' };
export const EMPTY_GROUP = {
  nome: '',
  min: 0,
  max: 1,
  obrigatorio: false,
  tipo_grupo: 'opcoes',
  divisivel: false,
  regra_preco: 'maior_preco',
  itens: [],
};

export const DIAS_SEMANA = [
  { key: 'domingo', label: 'Domingo' },
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
];

export function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getTamanhosValidos(tamanhos) {
  return (tamanhos || [])
    .filter((t) => t.nome.trim() && String(t.preco).trim() !== '')
    .map((t) => ({ nome: t.nome.trim(), preco: Number(t.preco) }));
}

export function getPrecoPrincipalFromTamanhos(tamanhos) {
  if (!tamanhos.length) return 0;
  if (tamanhos.length === 1) return Number(tamanhos[0].preco);
  return Math.min(...tamanhos.map((t) => Number(t.preco)));
}

export function createInitialHorarios() {
  return DIAS_SEMANA.map((dia) => ({
    dia: dia.key,
    label: dia.label,
    ativo: false,
    abertura: '',
    fechamento: '',
  }));
}

export function createInitialForm() {
  return {
    id_categoria: '',
    nome: '',
    descricao: '',
    disponibilidade_horarios: '',
    usarControleHorario: false,
    horarios: createInitialHorarios(),
    imagemFile: null,
    imagemPreview: '',
    tamanhos: [],
    adicionais: [],
    grupos_opcoes: [],
  };
}

export function buildDisponibilidadeConfig(form) {
  if (!form.usarControleHorario) return null;

  const diasAtivos = (form.horarios || [])
    .filter((dia) => dia.ativo && dia.abertura && dia.fechamento)
    .map((dia) => ({
      dia: dia.dia,
      abertura: dia.abertura,
      fechamento: dia.fechamento,
      ativo: true,
    }));

  return { habilitado: true, dias: diasAtivos };
}

export function buildConfiguracao(form) {
  const tamanhos = getTamanhosValidos(form.tamanhos);
  const adicionais = (form.adicionais || [])
    .filter((a) => a.nome.trim() && String(a.preco).trim() !== '')
    .map((a) => ({ nome: a.nome.trim(), preco: Number(a.preco) }));

  const grupos = (form.grupos_opcoes || [])
    .filter((g) => g.nome.trim())
    .map((g) => ({
      nome: g.nome.trim(),
      min: Number(g.min || 0),
      max: Number(g.max || 0),
      obrigatorio: Boolean(g.obrigatorio),
      tipo_grupo: g.tipo_grupo || 'opcoes',
      divisivel: Boolean(g.divisivel),
      regra_preco: g.tipo_grupo === 'sabores' ? g.regra_preco || 'maior_preco' : null,
      itens: (g.itens || [])
        .filter((i) => i.nome.trim() && String(i.preco).trim() !== '')
        .map((i) => ({ nome: i.nome.trim(), preco: Number(i.preco) })),
    }))
    .filter((g) => g.itens.length > 0);

  const config = {
    usa_preco_por_tamanho: tamanhos.length > 0,
    multiplo_tamanhos: tamanhos.length > 1,
  };

  if (tamanhos.length) config.tamanhos = tamanhos;
  if (adicionais.length) config.adicionais = adicionais;
  if (grupos.length) config.grupos_opcoes = grupos;

  const disponibilidade = buildDisponibilidadeConfig(form);
  if (disponibilidade) config.disponibilidade = disponibilidade;

  return config;
}

export function getResumoHorario(form) {
  if (!form.usarControleHorario) {
    return form.disponibilidade_horarios?.trim() || 'Sem controle específico';
  }

  const ativos = form.horarios.filter((d) => d.ativo && d.abertura && d.fechamento);
  if (!ativos.length) return 'Nenhum dia configurado';

  return ativos.map((d) => `${d.label}: ${d.abertura} - ${d.fechamento}`).join(' | ');
}
