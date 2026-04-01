import { useEffect } from 'react';
import { getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';
import { applyTheme, getStoredTheme } from '../utils/theme';

function getThemeProfileKey() {
  const admin = getCurrentAdmin();
  if (admin) return `admin_${admin.id || admin.email || 'atual'}`;

  const store = getCurrentStore();
  if (store) return `store_${store.id || 'atual'}`;

  const user = getCurrentUser();
  if (user) return `user_${user.id || 'atual'}`;

  return 'global';
}

export default function ThemeBootstrap() {
  useEffect(() => {
    function syncTheme() {
      const profileKey = getThemeProfileKey();
      applyTheme(getStoredTheme(profileKey));
    }

    syncTheme();
    window.addEventListener('storage', syncTheme);
    window.addEventListener('auth-changed', syncTheme);
    window.addEventListener('theme-changed', syncTheme);

    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('auth-changed', syncTheme);
      window.removeEventListener('theme-changed', syncTheme);
    };
  }, []);

  return null;
}
