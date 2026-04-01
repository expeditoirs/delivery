export const EMPTY_SIZE = { nome: '', preco: '', min_sabores: '', max_sabores: '' };
export const EMPTY_OPTION = { nome: '', preco: '', precos_por_tamanho: {} };
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
  { key: 'terca', label: 'Terca' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sabado' },
];

export const STORE_STATUS_OPTIONS = [
  { value: 'auto', label: 'Seguir horario', helper: 'Abre e fecha de acordo com a agenda semanal.' },
  { value: 'open', label: 'Forcar aberto', helper: 'Mantem a loja aberta manualmente.' },
  { value: 'closed', label: 'Forcar fechado', helper: 'Fecha a loja ate voce liberar novamente.' },
];

export const PRODUCT_PRESETS = [
  { key: 'pizza', label: 'Pizza', description: 'Tamanhos, sabores e bordas' },
  { key: 'acai', label: 'Acai', description: 'Copos por tamanho e complementos' },
  { key: 'burger', label: 'Hamburguer', description: 'Extras, ponto e combo' },
  { key: 'drink', label: 'Bebida', description: 'Lata, 600ml e 2L' },
  { key: 'meal', label: 'Marmita', description: 'Proteina e acompanhamentos' },
];

export function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseStoreConfig(rawConfig) {
  if (!rawConfig) return {};
  if (typeof rawConfig === 'object') return rawConfig;
  try {
    return JSON.parse(rawConfig);
  } catch {
    return {};
  }
}

export function createStoreSchedule() {
  return DIAS_SEMANA.map((dia) => ({
    dia: dia.key,
    label: dia.label,
    ativo: false,
    abertura: '',
    fechamento: '',
  }));
}

export function normalizeStoreSchedule(value) {
  const base = createStoreSchedule();
  if (!Array.isArray(value)) return base;
  return base.map((item) => {
    const current = value.find((entry) => entry?.dia === item.dia) || {};
    return {
      ...item,
      ativo: Boolean(current.ativo),
      abertura: current.abertura || '',
      fechamento: current.fechamento || '',
    };
  });
}

export function getStoreSchedule(empresa) {
  const config = parseStoreConfig(empresa?.config_gerais);
  return normalizeStoreSchedule(config?.store_schedule);
}

export function getDeliveryFee(empresa) {
  const config = parseStoreConfig(empresa?.config_gerais);
  return Number(config?.taxa_entrega || 0);
}

export function getStoreManualStatus(empresa) {
  const config = parseStoreConfig(empresa?.config_gerais);
  return String(config?.store_status_override || 'auto');
}

export function getStorePauseUntil(empresa) {
  const config = parseStoreConfig(empresa?.config_gerais);
  return config?.store_pause_until || null;
}

function getCurrentDayKey(referenceDate = new Date()) {
  return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][referenceDate.getDay()];
}

function toMinutes(value) {
  if (!value || !String(value).includes(':')) return null;
  const [hour, minute] = String(value).split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function isWithinSchedule(daySchedule, referenceDate = new Date()) {
  if (!daySchedule?.ativo) return false;
  const opening = toMinutes(daySchedule.abertura);
  const closing = toMinutes(daySchedule.fechamento);
  if (opening === null || closing === null) return false;
  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  if (closing > opening) {
    return nowMinutes >= opening && nowMinutes <= closing;
  }
  return nowMinutes >= opening || nowMinutes <= closing;
}

export function buildStoreHoursSummary(schedule) {
  const normalized = normalizeStoreSchedule(schedule);
  const activeDays = normalized.filter((item) => item.ativo && item.abertura && item.fechamento);
  if (!activeDays.length) return 'Horario ainda nao configurado';
  return activeDays.map((item) => `${item.label}: ${item.abertura} - ${item.fechamento}`).join(' | ');
}

export function getStoreOperationalSnapshot(empresa, referenceDate = new Date()) {
  const schedule = getStoreSchedule(empresa);
  const override = getStoreManualStatus(empresa);
  const pauseUntil = getStorePauseUntil(empresa);
  const pauseDate = pauseUntil ? new Date(pauseUntil) : null;
  const paused = pauseDate && !Number.isNaN(pauseDate.getTime()) && pauseDate.getTime() > referenceDate.getTime();

  if (paused) {
    return {
      code: 'paused',
      label: 'Pausada',
      tone: 'amber',
      detail: `Retorna ${pauseDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      isOpen: false,
      schedule,
      override,
      pauseUntil,
    };
  }

  if (override === 'open') {
    return {
      code: 'open',
      label: 'Aberta manualmente',
      tone: 'emerald',
      detail: 'Status manual ativo.',
      isOpen: true,
      schedule,
      override,
      pauseUntil,
    };
  }

  if (override === 'closed') {
    return {
      code: 'closed',
      label: 'Fechada manualmente',
      tone: 'rose',
      detail: 'Status manual ativo.',
      isOpen: false,
      schedule,
      override,
      pauseUntil,
    };
  }

  const currentDay = schedule.find((item) => item.dia === getCurrentDayKey(referenceDate));
  const withinSchedule = isWithinSchedule(currentDay, referenceDate);
  return {
    code: withinSchedule ? 'open' : 'closed',
    label: withinSchedule ? 'Aberta agora' : 'Fechada agora',
    tone: withinSchedule ? 'emerald' : 'slate',
    detail: currentDay?.ativo && currentDay?.abertura && currentDay?.fechamento
      ? `${currentDay.label}: ${currentDay.abertura} - ${currentDay.fechamento}`
      : 'Sem horario para hoje.',
    isOpen: withinSchedule,
    schedule,
    override,
    pauseUntil,
  };
}

export function buildStoreConfig(empresa, nextConfig = {}) {
  const current = parseStoreConfig(empresa?.config_gerais);
  return JSON.stringify({ ...current, ...nextConfig });
}

export function getTamanhosValidos(tamanhos) {
  return (tamanhos || [])
    .filter((t) => t.nome.trim() && String(t.preco).trim() !== '')
    .map((t) => ({
      nome: t.nome.trim(),
      preco: Number(t.preco),
      ...(String(t.min_sabores).trim() !== '' ? { min_sabores: Number(t.min_sabores) } : {}),
      ...(String(t.max_sabores).trim() !== '' ? { max_sabores: Number(t.max_sabores) } : {}),
    }));
}

export function getPrecoPrincipalFromTamanhos(tamanhos, precoFixo = 0) {
  if (!tamanhos.length) return Number(precoFixo || 0);
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
    tipo_produto: 'normal',
    usar_tamanhos: true,
    preco_fixo: '',
    id_categoria: '',
    nome: '',
    descricao: '',
    disponibilidade_horarios: '',
    usarControleHorario: false,
    horarios: createInitialHorarios(),
    imagemFile: null,
    imagemPreview: '',
    imagemDataUrl: '',
    tamanhos: [],
    adicionais: [],
    grupos_opcoes: [],
  };
}

function createOption(nome, preco = '0.00', precosPorTamanho = {}) {
  return { nome, preco, precos_por_tamanho: precosPorTamanho };
}

function buildPresetPizza() {
  return {
    tipo_produto: 'pizza',
    usar_tamanhos: true,
    preco_fixo: '',
    nome: 'Pizza personalizada',
    descricao: 'Monte sua pizza escolhendo tamanho, sabores e adicionais.',
    tamanhos: [
      { nome: 'Pequena', preco: '29.90', min_sabores: '1', max_sabores: '1' },
      { nome: 'Media', preco: '39.90', min_sabores: '2', max_sabores: '2' },
      { nome: 'Grande', preco: '49.90', min_sabores: '2', max_sabores: '2' },
    ],
    adicionais: [
      createOption('Borda recheada', '8.00'),
      createOption('Queijo extra', '5.00'),
    ],
    grupos_opcoes: [
      {
        nome: 'Sabores',
        min: 1,
        max: 2,
        obrigatorio: true,
        tipo_grupo: 'sabores',
        divisivel: true,
        regra_preco: 'maior_preco',
        itens: [
          createOption('Calabresa', '29.90', { Pequena: '29.90', Media: '39.90', Grande: '49.90' }),
          createOption('Marguerita', '31.90', { Pequena: '31.90', Media: '41.90', Grande: '51.90' }),
          createOption('Frango com catupiry', '33.90', { Pequena: '33.90', Media: '43.90', Grande: '53.90' }),
        ],
      },
      {
        nome: 'Massa',
        min: 1,
        max: 1,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Tradicional'),
          createOption('Fina'),
        ],
      },
    ],
  };
}

function buildPresetAcai() {
  return {
    tipo_produto: 'acai',
    usar_tamanhos: true,
    preco_fixo: '',
    nome: 'Acai montavel',
    descricao: 'Escolha o tamanho, complementos e adicionais do seu acai.',
    tamanhos: [
      { nome: '300ml', preco: '12.00', min_sabores: '', max_sabores: '' },
      { nome: '500ml', preco: '16.00', min_sabores: '', max_sabores: '' },
      { nome: '700ml', preco: '21.00', min_sabores: '', max_sabores: '' },
    ],
    adicionais: [
      createOption('Leite condensado', '2.50'),
      createOption('Pacoca', '2.00'),
      createOption('Granola', '2.00'),
    ],
    grupos_opcoes: [
      {
        nome: 'Complementos',
        min: 2,
        max: 5,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Banana'),
          createOption('Morango'),
          createOption('Granola'),
          createOption('Leite em po'),
        ],
      },
    ],
  };
}

function buildPresetBurger() {
  return {
    tipo_produto: 'normal',
    usar_tamanhos: false,
    preco_fixo: '24.90',
    nome: 'Hamburguer artesanal',
    descricao: 'Produto simples com extras, ponto da carne e opcao de combo.',
    tamanhos: [],
    adicionais: [
      createOption('Bacon extra', '4.00'),
      createOption('Queijo extra', '3.50'),
      createOption('Ovo', '2.50'),
    ],
    grupos_opcoes: [
      {
        nome: 'Ponto da carne',
        min: 1,
        max: 1,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Ao ponto'),
          createOption('Bem passada'),
        ],
      },
      {
        nome: 'Transformar em combo',
        min: 0,
        max: 1,
        obrigatorio: false,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Combo com fritas e refri', '12.00'),
        ],
      },
    ],
  };
}

function buildPresetDrink() {
  return {
    tipo_produto: 'normal',
    usar_tamanhos: true,
    preco_fixo: '',
    nome: 'Bebida',
    descricao: 'Produto por volume com variacao de preco por tamanho.',
    tamanhos: [
      { nome: 'Lata 350ml', preco: '6.00', min_sabores: '', max_sabores: '' },
      { nome: '600ml', preco: '8.50', min_sabores: '', max_sabores: '' },
      { nome: '2L', preco: '13.00', min_sabores: '', max_sabores: '' },
    ],
    adicionais: [],
    grupos_opcoes: [
      {
        nome: 'Sabor',
        min: 1,
        max: 1,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Coca-Cola'),
          createOption('Guarana'),
          createOption('Fanta Laranja'),
        ],
      },
    ],
  };
}

function buildPresetMeal() {
  return {
    tipo_produto: 'normal',
    usar_tamanhos: true,
    preco_fixo: '',
    nome: 'Marmita',
    descricao: 'Escolha tamanho, proteina e acompanhamentos da marmita.',
    tamanhos: [
      { nome: 'Pequena', preco: '18.00', min_sabores: '', max_sabores: '' },
      { nome: 'Media', preco: '22.00', min_sabores: '', max_sabores: '' },
      { nome: 'Grande', preco: '27.00', min_sabores: '', max_sabores: '' },
    ],
    adicionais: [
      createOption('Ovo frito', '2.50'),
      createOption('Farofa', '1.50'),
    ],
    grupos_opcoes: [
      {
        nome: 'Proteina',
        min: 1,
        max: 1,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Frango grelhado'),
          createOption('Carne assada', '3.00'),
          createOption('Peixe empanado', '4.00'),
        ],
      },
      {
        nome: 'Acompanhamentos',
        min: 2,
        max: 4,
        obrigatorio: true,
        tipo_grupo: 'opcoes',
        divisivel: false,
        regra_preco: null,
        itens: [
          createOption('Arroz'),
          createOption('Feijao'),
          createOption('Macarrao'),
          createOption('Salada'),
        ],
      },
    ],
  };
}

export function applyProductPreset(presetKey, currentForm = createInitialForm()) {
  const baseForm = createInitialForm();
  const preserved = {
    id_categoria: currentForm.id_categoria || '',
    disponibilidade_horarios: currentForm.disponibilidade_horarios || '',
    usarControleHorario: Boolean(currentForm.usarControleHorario),
    horarios: currentForm.horarios?.length ? currentForm.horarios : createInitialHorarios(),
    imagemFile: null,
    imagemPreview: '',
    imagemDataUrl: '',
  };

  const presetBuilders = {
    pizza: buildPresetPizza,
    acai: buildPresetAcai,
    burger: buildPresetBurger,
    drink: buildPresetDrink,
    meal: buildPresetMeal,
  };

  const builder = presetBuilders[presetKey];
  if (!builder) {
    return { ...baseForm, ...preserved };
  }

  return {
    ...baseForm,
    ...preserved,
    ...builder(),
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
  const usaTamanhos = Boolean(form.usar_tamanhos || form.tipo_produto === 'pizza');
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
        .filter((i) => i.nome.trim())
        .map((i) => {
          const precosPorTamanho = Object.entries(i.precos_por_tamanho || {})
            .filter(([, value]) => String(value).trim() !== '')
            .reduce((acc, [key, value]) => ({ ...acc, [key]: Number(value) }), {});
          return {
            nome: i.nome.trim(),
            preco: String(i.preco).trim() !== '' ? Number(i.preco) : 0,
            ...(Object.keys(precosPorTamanho).length ? { precos_por_tamanho: precosPorTamanho } : {}),
          };
        }),
    }))
    .filter((g) => g.itens.length > 0);

  const config = {
    tipo_produto: form.tipo_produto || 'normal',
    usa_preco_por_tamanho: usaTamanhos && tamanhos.length > 0,
    multiplo_tamanhos: tamanhos.length > 1,
    permite_observacao: true,
  };

  if (tamanhos.length) config.tamanhos = tamanhos;
  if (!usaTamanhos && String(form.preco_fixo).trim() !== '') config.preco_fixo = Number(form.preco_fixo);
  if (adicionais.length) config.adicionais = adicionais;
  if (grupos.length) config.grupos_opcoes = grupos;

  const disponibilidade = buildDisponibilidadeConfig(form);
  if (disponibilidade) config.disponibilidade = disponibilidade;

  return config;
}

export function getResumoHorario(form) {
  if (!form.usarControleHorario) {
    return form.disponibilidade_horarios?.trim() || 'Sem controle especifico';
  }

  const ativos = form.horarios.filter((d) => d.ativo && d.abertura && d.fechamento);
  if (!ativos.length) return 'Nenhum dia configurado';

  return ativos.map((d) => `${d.label}: ${d.abertura} - ${d.fechamento}`).join(' | ');
}
