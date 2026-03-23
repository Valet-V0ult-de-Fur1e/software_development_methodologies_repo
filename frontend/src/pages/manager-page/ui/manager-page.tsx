import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { productsApi } from '@/shared/api/products-api'
import { ordersApi } from '@/shared/api/orders-api'
import { lookupsApi } from '@/shared/api/lookups-api'
import type { Product } from '@/entities/product/model/types'
import type { Order, OrderStatus } from '@/entities/order/model/types'
import type { LookupItem } from '@/shared/types/lookup'
import { getOrderStatusLabel, ORDER_STATUS_OPTIONS } from '@/shared/lib/order-status'

type ProductDraft = {
  name: string
  price: number
  discount: number
  stock_quantity: number
  description: string
}

const toProductDraft = (product: Product): ProductDraft => ({
  name: product.name,
  price: Number(product.price),
  discount: Number(product.discount ?? 0),
  stock_quantity: product.stock_quantity,
  description: product.description ?? '',
})

const emptyProduct = {
  article: '',
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
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [suppliers, setSuppliers] = useState<LookupItem[]>([])
  const [manufacturers, setManufacturers] = useState<LookupItem[]>([])
  const [categories, setCategories] = useState<LookupItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [newProduct, setNewProduct] = useState(emptyProduct)
  const [newProductPhotos, setNewProductPhotos] = useState<File[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editPhotoFiles, setEditPhotoFiles] = useState<Record<number, File[]>>({})
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<number, OrderStatus>>({})

  const loadData = () => {
    Promise.all([
      productsApi.list(),
      ordersApi.listAll(),
      lookupsApi.list('suppliers'),
      lookupsApi.list('manufacturers'),
      lookupsApi.list('categories'),
      lookupsApi.list('units'),
    ])
      .then(([productData, orderData, supplierData, manufacturerData, categoryData, unitData]) => {
        setProducts(productData.items)
        const draftMap = productData.items.reduce<Record<number, ProductDraft>>((acc, product) => {
          acc[product.id] = toProductDraft(product)
          return acc
        }, {})
        setProductDrafts(draftMap)
        setOrders(orderData)
        const statusDraftMap = orderData.reduce<Record<number, OrderStatus>>((acc, order) => {
          acc[order.id] = order.status
          return acc
        }, {})
        setOrderStatusDrafts(statusDraftMap)
        setSuppliers(supplierData)
        setManufacturers(manufacturerData)
        setCategories(categoryData)
        setUnits(unitData)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить данные менеджера'))
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    if (!query) {
      return products
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.article.toLowerCase().includes(query)
      )
    })
  }, [productQuery, products])

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') {
      return orders
    }
    return orders.filter((order) => order.status === orderStatusFilter)
  }, [orderStatusFilter, orders])

  const productNameById = useMemo(() => {
    return products.reduce<Record<number, string>>((acc, product) => {
      acc[product.id] = product.name
      return acc
    }, {})
  }, [products])

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      shipping: orders.filter((order) => ['confirmed', 'shipped'].includes(order.status)).length,
      delivered: orders.filter((order) => order.status === 'delivered').length,
    }
  }, [orders])

  const discountedCount = useMemo(() => {
    return products.filter((product) => Number(product.discount) > 0).length
  }, [products])

  const avgDiscount = useMemo(() => {
    if (products.length === 0) {
      return 0
    }
    const sum = products.reduce((acc, product) => acc + Number(product.discount ?? 0), 0)
    return sum / products.length
  }, [products])

  const generatedProductName = useMemo(() => {
    const categoryName = categories.find((item) => item.id === newProduct.category_id)?.name ?? ''
    const manufacturerName = manufacturers.find((item) => item.id === newProduct.manufacturer_id)?.name ?? ''
    return [categoryName, manufacturerName, newProduct.article].filter(Boolean).join(' ')
  }, [categories, manufacturers, newProduct.article, newProduct.category_id, newProduct.manufacturer_id])

  const createProduct = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    setIsSubmitting(true)
    try {
      const payload = {
        ...newProduct,
        name: generatedProductName,
      }

      const createdProduct = await productsApi.create(payload)
      if (newProductPhotos.length > 0) {
        await productsApi.uploadPhotos(createdProduct.id, newProductPhotos)
      }
      setNewProduct(emptyProduct)
      setNewProductPhotos([])
      setMessage('Товар добавлен в каталог.')
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать товар')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    setError('')
    try {
      await ordersApi.update(orderId, { status })
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить статус заказа')
    }
  }

  const applyOrderStatusDraft = async (orderId: number) => {
    const status = orderStatusDrafts[orderId]
    if (!status) {
      return
    }

    await updateOrderStatus(orderId, status)
  }

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const removeProduct = async (productId: number) => {
    if (!window.confirm('Удалить товар из каталога?')) {
      return
    }
    setError('')
    try {
      await productsApi.remove(productId)
      setMessage('Товар удален.')
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить товар')
    }
  }

  const saveProduct = async (productId: number) => {
    const row = productDrafts[productId]
    if (!row) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.update(productId, {
        name: row.name,
        price: row.price,
        discount: row.discount,
        stock_quantity: row.stock_quantity,
        description: row.description,
      })

      setProducts((prev) => prev.map((product) => (product.id === productId ? updated : product)))
      setProductDrafts((prev) => ({ ...prev, [productId]: toProductDraft(updated) }))
      setMessage(`Товар #${productId} обновлен.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить товар')
    }
  }

  const uploadEditPhotos = async (productId: number) => {
    const files = editPhotoFiles[productId] ?? []
    if (files.length === 0) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.uploadPhotos(productId, files)
      setProducts((prev) => prev.map((product) => (product.id === productId ? updated : product)))
      setEditPhotoFiles((prev) => ({ ...prev, [productId]: [] }))
      setMessage(`Фотографии товара #${productId} обновлены.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить фотографии товара')
    }
  }

  const deleteProductPhoto = async (productId: number, photoId: number) => {
    if (!window.confirm('Удалить фотографию товара?')) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.removePhoto(productId, photoId)
      setProducts((prev) => prev.map((product) => (product.id === productId ? updated : product)))
      setMessage(`Фотография товара #${productId} удалена.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить фотографию товара')
    }
  }

  return (
    <section className="stack">
      <article className="card stack manager-hero">
        <h1>Панель менеджера</h1>
        <p className="muted">
          Управляйте ассортиментом и отслеживайте обработку заказов в одном месте.
        </p>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Товаров в каталоге</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Товаров со скидкой</span>
            <strong>{discountedCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Заказов в работе</span>
            <strong>{orderStats.pending + orderStats.shipping}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Средняя скидка</span>
            <strong>{avgDiscount.toFixed(1)}%</strong>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
      </article>

      <article className="card stack">
        <h2>Добавить товар в каталог</h2>
        <p className="muted">Заполните карточку, товар сразу появится в витрине.</p>
        <form className="manager-grid" onSubmit={createProduct}>
          <label className="stack field">
            <span>Артикул</span>
            <input
              value={newProduct.article}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, article: e.target.value }))}
              required
            />
          </label>
          <label className="stack field">
            <span>Сгенерированное простое название</span>
            <input value={generatedProductName} readOnly />
          </label>
          <label className="stack field">
            <span>Цена</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={newProduct.price}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: Number(e.target.value) }))}
              required
            />
          </label>
          <label className="stack field">
            <span>Действующая скидка (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={newProduct.discount}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, discount: Number(e.target.value) }))}
              required
            />
          </label>
          <label className="stack field">
            <span>Кол-во на складе</span>
            <input
              type="number"
              min={0}
              value={newProduct.stock_quantity}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, stock_quantity: Number(e.target.value) }))}
              required
            />
          </label>
          <label className="stack field">
            <span>Наименование товара (тип)</span>
            <select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
              required
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? `#${item.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="stack field">
            <span>Поставщик</span>
            <select
              value={newProduct.supplier_id}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, supplier_id: Number(e.target.value) }))}
              required
            >
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? `#${item.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="stack field">
            <span>Производитель</span>
            <select
              value={newProduct.manufacturer_id}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, manufacturer_id: Number(e.target.value) }))}
              required
            >
              {manufacturers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? `#${item.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="stack field">
            <span>Единица измерения</span>
            <select
              value={newProduct.unit_id}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, unit_id: Number(e.target.value) }))}
              required
            >
              {units.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? `#${item.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="stack field">
            <span>Описание</span>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label className="stack field">
            <span>Фотографии товара (необязательно, можно несколько)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewProductPhotos(Array.from(e.target.files ?? []))}
            />
          </label>
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Создать товар'}
          </button>
        </form>
      </article>

      <article className="card stack">
        <div className="panel-toolbar">
          <h2>Товары</h2>
          <label className="stack field">
            <span>Поиск товара</span>
            <input
              placeholder="По названию или артикулу"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
            />
          </label>
        </div>
        {filteredProducts.map((product) => (
          <div className="entity-row" key={product.id}>
            <div className="entity-main">
              <strong>{product.article}</strong>
              <span className="muted">ID: {product.id}</span>
            </div>
            <input
              value={productDrafts[product.id]?.name ?? product.name}
              onChange={(e) =>
                setProductDrafts((prev) => ({
                  ...prev,
                  [product.id]: { ...(prev[product.id] ?? toProductDraft(product)), name: e.target.value },
                }))
              }
              placeholder="Наименование"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={productDrafts[product.id]?.price ?? Number(product.price)}
              onChange={(e) =>
                setProductDrafts((prev) => ({
                  ...prev,
                  [product.id]: { ...(prev[product.id] ?? toProductDraft(product)), price: Number(e.target.value) },
                }))
              }
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={productDrafts[product.id]?.discount ?? Number(product.discount ?? 0)}
              onChange={(e) =>
                setProductDrafts((prev) => ({
                  ...prev,
                  [product.id]: { ...(prev[product.id] ?? toProductDraft(product)), discount: Number(e.target.value) },
                }))
              }
            />
            <input
              type="number"
              min={0}
              value={productDrafts[product.id]?.stock_quantity ?? product.stock_quantity}
              onChange={(e) =>
                setProductDrafts((prev) => ({
                  ...prev,
                  [product.id]: { ...(prev[product.id] ?? toProductDraft(product)), stock_quantity: Number(e.target.value) },
                }))
              }
            />
            <div className="row">
              <button className="button-primary" onClick={() => saveProduct(product.id)}>
                Сохранить
              </button>
              <button className="button-secondary" onClick={() => removeProduct(product.id)}>
                Удалить
              </button>
            </div>
            <div className="stack" style={{ minWidth: '280px' }}>
              <span className="muted">Фото: {product.photos.length}</span>
              {product.photos.map((photo) => (
                <div key={photo.id} className="row">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/products/photo/${photo.filename}`}
                    alt={`Фото ${product.name}`}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <span className="muted">#{photo.id}</span>
                  <button className="button-secondary danger-button" onClick={() => deleteProductPhoto(product.id, photo.id)}>
                    Удалить фото
                  </button>
                </div>
              ))}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setEditPhotoFiles((prev) => ({ ...prev, [product.id]: Array.from(e.target.files ?? []) }))
                }
              />
              <button className="button-secondary" onClick={() => uploadEditPhotos(product.id)}>
                Добавить фото
              </button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && <p className="muted">Ничего не найдено.</p>}
      </article>

      <article className="card stack">
        <div className="panel-toolbar">
          <h2>Заказы</h2>
          <label className="stack field">
            <span>Фильтр по статусу</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value as 'all' | OrderStatus)}
            >
              <option value="all">Все статусы</option>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filteredOrders.map((order) => (
          <div className="stack" key={order.id}>
            <div className="entity-row">
              <div className="entity-main">
                <strong>#{order.order_number}</strong>
                <span className="muted">Позиций: {order.items.length}</span>
                <span className="muted">Код получения: {order.pickup_code}</span>
              </div>
              <span>{order.total_price.toFixed(2)} ₽</span>
              <span className="badge">{getOrderStatusLabel(order.status)}</span>
              <div className="row">
                <select
                  value={orderStatusDrafts[order.id] ?? order.status}
                  onChange={(e) =>
                    setOrderStatusDrafts((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))
                  }
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  className="button-primary"
                  onClick={() => applyOrderStatusDraft(order.id)}
                  disabled={(orderStatusDrafts[order.id] ?? order.status) === order.status}
                >
                  Указать статус
                </button>
                <button className="button-secondary" onClick={() => toggleOrderDetails(order.id)}>
                  {expandedOrders[order.id] ? 'Скрыть состав' : 'Состав заказа'}
                </button>
                <button
                  className="button-primary"
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  Заказ закрыт
                </button>
                <button
                  className="button-secondary danger-button"
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  Отменить заказ
                </button>
              </div>
            </div>

            {expandedOrders[order.id] && (
              <div className="card stack">
                <h3>Содержимое заказа</h3>
                <p className="muted">Код получения для клиента: {order.pickup_code}</p>
                {order.items.map((item) => (
                  <div className="entity-row" key={item.id}>
                    <div className="entity-main">
                      <strong>{productNameById[item.product_id] ?? `Товар #${item.product_id}`}</strong>
                      <span className="muted">ID товара: {item.product_id}</span>
                    </div>
                    <span>Количество: {item.quantity}</span>
                    <span>Цена: {Number(item.price_at_order).toFixed(2)} ₽</span>
                    <span>Сумма: {(Number(item.price_at_order) * item.quantity).toFixed(2)} ₽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && <p className="muted">Заказы по текущему фильтру не найдены.</p>}
      </article>
    </section>
  )
}
