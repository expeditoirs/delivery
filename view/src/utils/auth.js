const AUTH_KEY = 'auth';
const TOKEN_KEY = 'token';

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveAuth(data) {
  if (!data?.access_token) return;
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('auth-changed'));
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  return getStoredAuth()?.usuario || null;
}

export function getCurrentStore() {
  return getStoredAuth()?.empresa || null;
}

export function getCurrentAdmin() {
  return getStoredAuth()?.administrador || null;
}

export function getCurrentSessionProfileKey() {
  const auth = getStoredAuth();
  if (auth?.administrador) {
    return `admin_${auth.administrador.id || auth.administrador.email || 'atual'}`;
  }
  if (auth?.empresa) {
    return `store_${auth.empresa.id || 'atual'}`;
  }
  if (auth?.usuario) {
    return `user_${auth.usuario.id || 'atual'}`;
  }
  return 'global';
}

export function isAuthenticated() {
  return Boolean(getAccessToken() && getStoredAuth());
}

export function isStoreSession() {
  return Boolean(getCurrentStore());
}

export function isAdminSession() {
  return Boolean(getCurrentAdmin());
}

export function isUserSession() {
  return Boolean(getCurrentUser());
}
