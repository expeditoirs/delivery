import { listPersistentKeysSync } from './indexedDbStorage';

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

export function getVersionedCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return {
      data: parsed.data ?? null,
      version: parsed.version ?? null,
      cachedAt: parsed.cachedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function setCache(key, data, ttlMs = 60_000) {
  try {
    localStorage.setItem(
      PREFIX + key,
      JSON.stringify({
        data,
        expiresAt: Date.now() + ttlMs,
      })
    );
  } catch {
    // ignore quota errors
  }
}

export function setVersionedCache(key, data, version, ttlMs = 60_000) {
  try {
    localStorage.setItem(
      PREFIX + key,
      JSON.stringify({
        data,
        version,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
      })
    );
  } catch {
    // ignore quota errors
  }
}

export function clearCacheByPrefix(prefix) {
  try {
    listPersistentKeysSync().forEach((key) => {
      if (key.startsWith(PREFIX + prefix)) localStorage.removeItem(key);
    });
  } catch {
    // ignore access errors
  }
}