import { getAccessToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function createAuthenticatedEventSource(path) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return null;
  }

  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const separator = path.includes('?') ? '&' : '?';
  return new EventSource(`${API_BASE_URL}${path}${separator}token=${encodeURIComponent(token)}`);
}
