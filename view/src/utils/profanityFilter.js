const BANNED_TERMS = [
  'fdp',
  'puta',
  'puto',
  'caralho',
  'cacete',
  'merda',
  'bosta',
  'porra',
  'desgraca',
  'desgraça',
  'arrombado',
  'arrombada',
  'otario',
  'otaria',
  'idiota',
  'imbecil',
  'babaca',
  'filho da puta',
  'vai se foder',
  'foder',
  'foda-se',
  'foda se',
  'cuzao',
  'cuzona',
];

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function containsProfanity(value) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return BANNED_TERMS.some((term) => normalized.includes(normalizeText(term)));
}