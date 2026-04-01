const THEME_STORAGE_PREFIX = 'theme_';
const DEFAULT_THEME = 'ocean';

export const THEMES = {
  ocean: {
    id: 'ocean',
    label: 'Oceano',
    mode: 'dark',
    colors: {
      primary: '#3B82F6',
      secondary: '#334155',
      accent: '#14B8A6',
      bg: '#0B0F19',
      surface: '#111827',
      surfaceSoft: 'rgba(17, 24, 39, 0.72)',
      text: '#CBD5E1',
      textMuted: '#94A3B8',
      border: 'rgba(148, 163, 184, 0.16)',
      glow: 'rgba(59, 130, 246, 0.12)',
    },
  },
  sunset: {
    id: 'sunset',
    label: 'Pôr do Sol',
    mode: 'dark',
    colors: {
      primary: '#F97316',
      secondary: '#7C2D12',
      accent: '#FB7185',
      bg: '#1C1917',
      surface: '#292524',
      surfaceSoft: 'rgba(41, 37, 36, 0.8)',
      text: '#F5F5F4',
      textMuted: '#D6D3D1',
      border: 'rgba(251, 113, 133, 0.18)',
      glow: 'rgba(249, 115, 22, 0.15)',
    },
  },
  forest: {
    id: 'forest',
    label: 'Floresta',
    mode: 'dark',
    colors: {
      primary: '#22C55E',
      secondary: '#14532D',
      accent: '#FACC15',
      bg: '#08130D',
      surface: '#0F1F17',
      surfaceSoft: 'rgba(15, 31, 23, 0.78)',
      text: '#DCFCE7',
      textMuted: '#86EFAC',
      border: 'rgba(34, 197, 94, 0.18)',
      glow: 'rgba(34, 197, 94, 0.14)',
    },
  },
  ivory: {
    id: 'ivory',
    label: 'Marfim',
    mode: 'light',
    colors: {
      primary: '#2563EB',
      secondary: '#CBD5E1',
      accent: '#F59E0B',
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceSoft: 'rgba(255, 255, 255, 0.82)',
      text: '#0F172A',
      textMuted: '#64748B',
      border: 'rgba(148, 163, 184, 0.24)',
      glow: 'rgba(37, 99, 235, 0.10)',
    },
  },
  rose: {
    id: 'rose',
    label: 'Rosé',
    mode: 'light',
    colors: {
      primary: '#E11D48',
      secondary: '#FBCFE8',
      accent: '#8B5CF6',
      bg: '#FFF7FB',
      surface: '#FFFFFF',
      surfaceSoft: 'rgba(255, 255, 255, 0.88)',
      text: '#3F0D1D',
      textMuted: '#9F1239',
      border: 'rgba(225, 29, 72, 0.14)',
      glow: 'rgba(236, 72, 153, 0.10)',
    },
  },
};

export function getThemeStorageKey(profileKey = 'global') {
  return `${THEME_STORAGE_PREFIX}${profileKey}`;
}

export function getThemeById(themeId) {
  return THEMES[themeId] || THEMES[DEFAULT_THEME];
}

export function getStoredTheme(profileKey = 'global') {
  try {
    const rawValue = localStorage.getItem(getThemeStorageKey(profileKey));
    return getThemeById(rawValue || DEFAULT_THEME);
  } catch {
    return THEMES[DEFAULT_THEME];
  }
}

export function saveStoredTheme(profileKey = 'global', themeId) {
  const theme = getThemeById(themeId);
  localStorage.setItem(getThemeStorageKey(profileKey), theme.id);
  window.dispatchEvent(new Event('theme-changed'));
  return theme;
}

export function applyTheme(themeIdOrTheme) {
  const theme = typeof themeIdOrTheme === 'string' ? getThemeById(themeIdOrTheme) : themeIdOrTheme;
  const root = document.documentElement;

  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-bg', theme.colors.bg);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-surface-soft', theme.colors.surfaceSoft);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-glow', theme.colors.glow);

  return theme;
}
