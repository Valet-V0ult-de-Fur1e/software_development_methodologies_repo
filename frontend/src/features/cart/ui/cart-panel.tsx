import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ordersApi } from '@/shared/api/orders-api'
import { lookupsApi } from '@/shared/api/lookups-api'
import { useCart } from '@/features/cart/model/cart-store'
import { useAuth } from '@/app/providers/auth-provider'

export const CartPanel = () => {
  const { user } = useAuth()
  const { items, totalPrice, changeQuantity, removeFromCart, clearCart } = useCart()
  const [pickupPointId, setPickupPointId] = useState<number | ''>('')
  const [pickupPoints, setPickupPoints] = useState<Array<{ id: number; city?: string; street?: string; house_number?: string }>>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    lookupsApi.list('pickup-points').then((data) => setPickupPoints(data)).catch(() => setPickupPoints([]))
  }, [])

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    if (!pickupPointId || !user || items.length === 0) {
      setMessage('Выберите пункт выдачи и добавьте товары.')
      return
    }

    try {
      await ordersApi.create({
        pickup_point_id: Number(pickupPointId),
        user_id: user.id,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      })
      clearCart()
      setMessage('Заказ создан.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка создания заказа.')
    }
  }

  return (
    <section className="card stack">
      <h2>Корзина</h2>
      {items.length === 0 && <p className="muted">Корзина пуста.</p>}
      {items.map((item) => (
        <div key={item.product.id} className="cart-line">
          <span>{item.product.name}</span>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => changeQuantity(item.product.id, Number(e.target.value))}
          />
          <button className="button-secondary" onClick={() => removeFromCart(item.product.id)}>
            Удалить
          </button>
        </div>
      ))}
      <p>Итого: {totalPrice.toFixed(2)} ₽</p>

      <form onSubmit={submitOrder} className="stack">
        <select value={pickupPointId} onChange={(e) => setPickupPointId(Number(e.target.value))} required>
          <option value="">Выберите пункт выдачи</option>
          {pickupPoints.map((point) => (
            <option key={point.id} value={point.id}>
              {point.city}, {point.street} {point.house_number}
            </option>
          ))}
        </select>
        <button className="button-primary" disabled={items.length === 0} type="submit">
          Оформить заказ
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  )
}
