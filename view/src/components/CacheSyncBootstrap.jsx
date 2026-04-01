import { useEffect } from 'react';
import { clearCacheByPrefix } from '../utils/browserCache';

const GLOBAL_VERSION_KEY = 'delivery-cache-version:global';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function invalidateClientCaches(nextVersion) {
  const previousVersion = localStorage.getItem(GLOBAL_VERSION_KEY);
  const normalizedVersion = String(nextVersion ?? '1');

  if (previousVersion === normalizedVersion) {
    return;
  }

  localStorage.setItem(GLOBAL_VERSION_KEY, normalizedVersion);
  clearCacheByPrefix('cardapio:');
  clearCacheByPrefix('buscar-base');
  clearCacheByPrefix('home-social-v2');
  window.dispatchEvent(new CustomEvent('catalog-cache-invalidated', {
    detail: { version: normalizedVersion },
  }));
}

export default function CacheSyncBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const stream = new EventSource(`${API_BASE_URL}/empresa/cache/stream`);

    function handleCacheVersion(event) {
      try {
        const payload = JSON.parse(event.data || '{}');
        invalidateClientCaches(payload.cache_version_global);
      } catch (error) {
        console.error('Falha ao processar evento de cache global', error);
      }
    }

    stream.addEventListener('cache-version', handleCacheVersion);
    stream.onerror = () => {
      // EventSource tenta reconectar automaticamente.
    };

    return () => {
      stream.removeEventListener('cache-version', handleCacheVersion);
      stream.close();
    };
  }, []);

  return null;
}
