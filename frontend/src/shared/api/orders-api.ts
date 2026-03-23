import type { Order, OrderCreatePayload, OrderUpdatePayload } from '@/entities/order/model/types'
import { apiRequest } from '@/shared/api/client'

export const ordersApi = {
  my: () => apiRequest<Order[]>('/orders/my-orders'),
  listAll: () => apiRequest<Order[]>('/orders/'),
  create: (payload: OrderCreatePayload) =>
    apiRequest<Order>('/orders/', {
      method: 'POST',
      body: payload,
    }),
  update: (id: number, payload: OrderUpdatePayload) =>
    apiRequest<Order>(`/orders/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
}
