import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { ordersApi } from '@/shared/api/orders-api'
import type { Order } from '@/entities/order/model/types'
import { getOrderStatusLabel } from '@/shared/lib/order-status'

export const OrdersPage = () => {
  const { role } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loader = role === 'manager' || role === 'admin' ? ordersApi.listAll : ordersApi.my
    loader()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить заказы'))
  }, [role])

  return (
    <section className="card stack">
      <h1>Заказы</h1>
      {error && <p className="error">{error}</p>}
      {orders.map((order) => (
        <article className="order-line" key={order.id}>
          <strong>#{order.order_number}</strong>
          <span>Код получения: {order.pickup_code}</span>
          <span>Статус: {getOrderStatusLabel(order.status)}</span>
          <span>Сумма: {Number(order.total_price).toFixed(2)} ₽</span>
          <span>Пункт выдачи: {order.pickup_point_id}</span>
        </article>
      ))}
      {orders.length === 0 && <p className="muted">Заказов пока нет.</p>}
    </section>
  )
}
