import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { productsApi } from '@/shared/api/products-api'
import { ordersApi } from '@/shared/api/orders-api'
import type { Product } from '@/entities/product/model/types'
import type { Order, OrderStatus } from '@/entities/order/model/types'

const emptyProduct = {
  article: '',
  name: '',
  unit_id: 1,
  price: 0,
  supplier_id: 1,
  manufacturer_id: 1,
  category_id: 1,
  discount: 0,
  stock_quantity: 0,
  description: '',
}

export const ManagerPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newProduct, setNewProduct] = useState(emptyProduct)
  const [error, setError] = useState('')

  const loadData = () => {
    Promise.all([productsApi.list(), ordersApi.listAll()])
      .then(([productData, orderData]) => {
        setProducts(productData.items)
        setOrders(orderData)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить данные менеджера'))
  }

  useEffect(() => {
    loadData()
  }, [])

  const createProduct = async (event: FormEvent) => {
    event.preventDefault()
    await productsApi.create(newProduct)
    setNewProduct(emptyProduct)
    loadData()
  }

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    await ordersApi.update(orderId, { status })
    loadData()
  }

  return (
    <section className="stack">
      <div className="card stack">
        <h1>Панель менеджера</h1>
        {error && <p className="error">{error}</p>}
      </div>

      <article className="card stack">
        <h2>Добавить товар</h2>
        <form className="manager-grid" onSubmit={createProduct}>
          <input placeholder="Артикул" value={newProduct.article} onChange={(e) => setNewProduct((prev) => ({ ...prev, article: e.target.value }))} required />
          <input placeholder="Название" value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} required />
          <input type="number" placeholder="Цена" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: Number(e.target.value) }))} required />
          <input type="number" placeholder="Остаток" value={newProduct.stock_quantity} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock_quantity: Number(e.target.value) }))} required />
          <input type="number" placeholder="Категория ID" value={newProduct.category_id} onChange={(e) => setNewProduct((prev) => ({ ...prev, category_id: Number(e.target.value) }))} required />
          <input type="number" placeholder="Поставщик ID" value={newProduct.supplier_id} onChange={(e) => setNewProduct((prev) => ({ ...prev, supplier_id: Number(e.target.value) }))} required />
          <input type="number" placeholder="Производитель ID" value={newProduct.manufacturer_id} onChange={(e) => setNewProduct((prev) => ({ ...prev, manufacturer_id: Number(e.target.value) }))} required />
          <input type="number" placeholder="Ед. изм. ID" value={newProduct.unit_id} onChange={(e) => setNewProduct((prev) => ({ ...prev, unit_id: Number(e.target.value) }))} required />
          <textarea placeholder="Описание" value={newProduct.description} onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))} />
          <button className="button-primary" type="submit">Создать товар</button>
        </form>
      </article>

      <article className="card stack">
        <h2>Товары</h2>
        {products.map((product) => (
          <div className="order-line" key={product.id}>
            <span>{product.name}</span>
            <span>{Number(product.price).toFixed(2)} ₽</span>
            <button className="button-secondary" onClick={() => productsApi.remove(product.id).then(loadData)}>
              Удалить
            </button>
          </div>
        ))}
      </article>

      <article className="card stack">
        <h2>Заказы</h2>
        {orders.map((order) => (
          <div className="order-line" key={order.id}>
            <span>#{order.order_number}</span>
            <span>{order.status}</span>
            <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        ))}
      </article>
    </section>
  )
}
