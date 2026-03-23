import type { OrderStatus } from '@/entities/order/model/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Создан',
  confirmed: 'Подтвержден',
  shipped: 'В пути',
  delivered: 'Закрыт',
  cancelled: 'Отменен',
}

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: ORDER_STATUS_LABELS.pending },
  { value: 'confirmed', label: ORDER_STATUS_LABELS.confirmed },
  { value: 'shipped', label: ORDER_STATUS_LABELS.shipped },
  { value: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { value: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
]

export const getOrderStatusLabel = (status: OrderStatus) => ORDER_STATUS_LABELS[status]
