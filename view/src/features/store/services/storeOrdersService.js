import api from '../../../core/api';

export async function fetchStoreOrders(storeId) {
  const { data } = await api.get(`/pedido/empresa/${storeId}`);
  return data || [];
}

export async function fetchOrderItems(orderId) {
  const { data } = await api.get(`/pedido/${orderId}/itens`);
  return data || [];
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.put(`/pedido/${orderId}/status`, { status });
  return data;
}
