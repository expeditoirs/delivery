import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'delivery_notifications_enabled';

export function useBrowserNotifications() {
  const [permission, setPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
  }, []);

  const supported = useMemo(() => permission !== 'unsupported', [permission]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      localStorage.setItem(STORAGE_KEY, 'true');
      setEnabled(true);
    }
    return result;
  }, []);

  const disableNotifications = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'false');
    setEnabled(false);
  }, []);

  const notify = useCallback((title, options = {}) => {
    if (!supported || permission !== 'granted' || !enabled) return null;
    return new Notification(title, options);
  }, [supported, permission, enabled]);

  return {
    supported,
    permission,
    enabled,
    requestPermission,
    disableNotifications,
    notify,
  };
}
