import re
import unicodedata

BANNED_TERMS = {
    'fdp',
    'puta',
    'puta que pariu',
    'puto',
    'caralho',
    'cacete',
    'merda',
    'bosta',
    'porra',
    'desgraca',
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
}


def normalize_text(value: str) -> str:
    base = unicodedata.normalize('NFD', value or '')
    without_marks = ''.join(char for char in base if unicodedata.category(char) != 'Mn')
    lowered = without_marks.lower()
    lowered = re.sub(r'[^a-z0-9\s]', ' ', lowered)
    lowered = re.sub(r'\s+', ' ', lowered).strip()
    return lowered


def contains_profanity(value: str) -> bool:
    normalized = normalize_text(value)
    if not normalized:
        return False
    return any(term in normalized for term in BANNED_TERMS)