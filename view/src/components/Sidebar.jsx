import { useEffect, useState } from 'react';
import { getCurrentAdmin, getCurrentStore, getCurrentUser } from '../utils/auth';
import SidebarAdmin from './SidebarAdmin';
import SidebarStore from './SidebarStore';
import SidebarClient from './SidebarClient';

export default function Sidebar() {
  const [session, setSession] = useState({
    user: getCurrentUser(),
    store: getCurrentStore(),
    admin: getCurrentAdmin(),
  });

  useEffect(() => {
    const sync = () =>
      setSession({
        user: getCurrentUser(),
        store: getCurrentStore(),
        admin: getCurrentAdmin(),
      });

    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync);
    };
  }, []);

  if (session.admin) return <SidebarAdmin />;
  if (session.store) return <SidebarStore />;
  return <SidebarClient />;
}