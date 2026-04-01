import { useEffect, useRef } from 'react';
import { fetchStoreOrders } from '../services/storeOrdersService';
import { createAuthenticatedEventSource } from '../../../utils/realtime';

export function useStoreOrderNotifications({ storeId, enabled, notify, onOrders }) {
  const seenRef = useRef(new Map());
  const enabledRef = useRef(enabled);
  const notifyRef = useRef(notify);
  const onOrdersRef = useRef(onOrders);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    onOrdersRef.current = onOrders;
  }, [onOrders]);

  useEffect(() => {
    if (!storeId) return undefined;

    let active = true;
    let stream = null;
    let fallbackTimer = null;

    const sync = async (firstLoad = false) => {
      try {
        const orders = await fetchStoreOrders(storeId, { limit: 50 });
        if (!active) return;
        onOrdersRef.current?.(orders);

        const nextMap = new Map();

        orders.forEach((order) => {
          const key = String(order.id);
          const previousStatus = seenRef.current.get(key);
          const currentStatus = String(order.status || '');
          nextMap.set(key, currentStatus);

          if (firstLoad) return;
          if (!enabledRef.current) return;

          if (!previousStatus) {
            notifyRef.current?.(`Novo pedido #${order.id}`, {
              body: `Total ${Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            });
            return;
          }

          if (previousStatus !== currentStatus) {
            notifyRef.current?.(`Pedido #${order.id} atualizado`, {
              body: `Status: ${currentStatus}`,
            });
          }
        });

        seenRef.current = nextMap;
      } catch (error) {
        console.error('Erro ao sincronizar pedidos da loja', error);
      }
    };

    sync(true);
    stream = createAuthenticatedEventSource('/pedido/stream/loja');

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
  }, [storeId]);
}
