const PREFIX = 'delivery-cache:';

export function getCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function setCache(key, data, ttlMs = 60_000) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, expiresAt: Date.now() + ttlMs }));
  } catch {}
}

export function clearCacheByPrefix(prefix) {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(PREFIX + prefix)) localStorage.removeItem(key);
    });
  } catch {}
}
