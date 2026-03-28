import { useEffect, useRef } from 'react';
import { fetchStoreOrders } from '../services/storeOrdersService';

export function useStoreOrderNotifications({ storeId, enabled, notify, onOrders }) {
  const seenRef = useRef(new Map());

  useEffect(() => {
    if (!storeId) return undefined;

    let active = true;

    const sync = async (firstLoad = false) => {
      try {
        const orders = await fetchStoreOrders(storeId);
        if (!active) return;
        onOrders?.(orders);

        const nextMap = new Map();

        orders.forEach((order) => {
          const key = String(order.id);
          const previousStatus = seenRef.current.get(key);
          const currentStatus = String(order.status || '');
          nextMap.set(key, currentStatus);

          if (firstLoad) return;
          if (!enabled) return;

          if (!previousStatus) {
            notify?.(`Novo pedido #${order.id}`, {
              body: `Total ${Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            });
            return;
          }

          if (previousStatus !== currentStatus) {
            notify?.(`Pedido #${order.id} atualizado`, {
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
    const timer = window.setInterval(() => sync(false), 12000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [storeId, enabled, notify, onOrders]);
}
