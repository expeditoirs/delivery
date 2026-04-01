import { useEffect, useRef } from 'react';
import api from '../../../core/api';
import { createAuthenticatedEventSource } from '../../../utils/realtime';

function getSnapshotKey(userId) {
  return `delivery_order_status_snapshot_user_${userId}`;
}

function readSnapshot(userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getSnapshotKey(userId)) || '{}');
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function saveSnapshot(userId, snapshotMap) {
  const payload = Object.fromEntries(snapshotMap.entries());
  localStorage.setItem(getSnapshotKey(userId), JSON.stringify(payload));
}

export function useUserOrderNotifications({ userId, enabled, notify }) {
  const seenRef = useRef(new Map());

  useEffect(() => {
    if (!userId) return undefined;

    seenRef.current = readSnapshot(userId);
    let active = true;
    let stream = null;
    let fallbackTimer = null;

    const sync = async (firstLoad = false) => {
      try {
        const { data } = await api.get(`/pedido/usuario/${userId}`);
        if (!active) return;

        const orders = Array.isArray(data) ? data : [];
        const nextMap = new Map();

        orders.forEach((order) => {
          const key = String(order.id);
          const previousStatus = seenRef.current.get(key);
          const currentStatus = String(order.status || '');

          nextMap.set(key, currentStatus);

          if (firstLoad || !enabled) return;

          if (previousStatus && previousStatus !== currentStatus) {
            notify?.(`Pedido #${order.id} atualizado`, {
              body: `Seu pedido agora está como "${currentStatus}".`,
              tag: `pedido-status-${order.id}`,
              data: {
                url: '/meuspedidos',
                orderId: order.id,
              },
            });
          }
        });

        seenRef.current = nextMap;
        saveSnapshot(userId, nextMap);
      } catch (error) {
        console.error('Erro ao sincronizar notificações do cliente', error);
      }
    };

    sync(true);
    stream = createAuthenticatedEventSource('/pedido/stream/usuario');

    if (stream) {
      stream.addEventListener('order-update', () => {
        sync(false);
      });

      stream.onerror = () => {
        if (!fallbackTimer) {
          fallbackTimer = window.setInterval(() => sync(false), 45000);
        }
      };
    } else {
      fallbackTimer = window.setInterval(() => sync(false), 30000);
    }

    return () => {
      active = false;
      if (stream) {
        stream.close();
      }
      if (fallbackTimer) {
        window.clearInterval(fallbackTimer);
      }
    };
  }, [enabled, notify, userId]);
}
