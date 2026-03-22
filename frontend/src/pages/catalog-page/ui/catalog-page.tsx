import { useEffect, useState } from 'react'
import { ProductGrid } from '@/widgets/product-grid/ui/product-grid'
import { productsApi } from '@/shared/api/products-api'
import type { Product } from '@/entities/product/model/types'
import { useAuth } from '@/app/providers/auth-provider'
import { CartPanel } from '@/features/cart/ui/cart-panel'

export const CatalogPage = () => {
  const { role } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    productsApi
      .list()
      .then((data) => setProducts(data.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить каталог'))
  }, [])

  return (
    <section className="stack">
      <div className="hero card">
        <h1>Каталог обуви</h1>
        <p>
          Гостевой доступ: только просмотр. Пользователь: корзина и заказы. Менеджер и админ:
          редактирование контента.
        </p>
      </div>
      {error && <p className="error">{error}</p>}
      <ProductGrid products={products} />
      {role === 'user' && <CartPanel />}
    </section>
  )
}
