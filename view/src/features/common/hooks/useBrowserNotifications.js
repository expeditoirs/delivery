import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentSessionProfileKey } from '../../../utils/auth';

const CONFIG_PREFIX = 'config_';
const STORAGE_EVENT = 'app-config-changed';

function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function getConfigKey(profileKey) {
  return `${CONFIG_PREFIX}${profileKey}`;
}

function readNotificationsEnabled(profileKey) {
  if (typeof window === 'undefined') return false;

  try {
    const config = JSON.parse(localStorage.getItem(getConfigKey(profileKey)) || '{}');
    return config.notificacoes ?? false;
  } catch {
    return false;
  }
}

function writeNotificationsEnabled(profileKey, enabled) {
  if (typeof window === 'undefined') return;

  let config = {};
  try {
    config = JSON.parse(localStorage.getItem(getConfigKey(profileKey)) || '{}');
  } catch {
    config = {};
  }

  localStorage.setItem(
    getConfigKey(profileKey),
    JSON.stringify({
      ...config,
      notificacoes: enabled,
    })
  );

  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function useBrowserNotifications() {
  const serviceWorkerRef = useRef(null);
  const [profileKey, setProfileKey] = useState(() => getCurrentSessionProfileKey());
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [enabled, setEnabled] = useState(() => readNotificationsEnabled(getCurrentSessionProfileKey()));

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/notification-sw.js')
      .then((registration) => {
        serviceWorkerRef.current = registration;
      })
      .catch((error) => {
        console.error('Falha ao registrar service worker de notificações', error);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => {
      const nextProfileKey = getCurrentSessionProfileKey();
      setProfileKey(nextProfileKey);
      setPermission(getNotificationPermission());
      setEnabled(readNotificationsEnabled(nextProfileKey));
    };

    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);
    window.addEventListener('theme-changed', sync);
    window.addEventListener(STORAGE_EVENT, sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('theme-changed', sync);
      window.removeEventListener(STORAGE_EVENT, sync);
    };
  }, []);

  const supported = useMemo(() => permission !== 'unsupported', [permission]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      writeNotificationsEnabled(profileKey, true);
      setEnabled(true);
    }

    return result;
  }, [profileKey]);

  const disableNotifications = useCallback(() => {
    writeNotificationsEnabled(profileKey, false);
    setEnabled(false);
  }, [profileKey]);

  const notify = useCallback(async (title, options = {}) => {
    if (!supported || permission !== 'granted' || !enabled) return null;

    const payload = {
      ...options,
      data: {
        profileKey,
        ...(options.data || {}),
      },
    };

    if (serviceWorkerRef.current?.showNotification) {
      await serviceWorkerRef.current.showNotification(title, payload);
      return serviceWorkerRef.current;
    }

    return new Notification(title, payload);
  }, [enabled, permission, profileKey, supported]);

  return {
    supported,
    permission,
    enabled,
    profileKey,
    requestPermission,
    disableNotifications,
    notify,
  };
}
