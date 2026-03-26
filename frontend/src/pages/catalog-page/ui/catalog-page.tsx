import { useEffect, useState } from 'react'
import { ProductGrid } from '@/widgets/product-grid/ui/product-grid'
import { productsApi } from '@/shared/api/products-api'
import type { Product } from '@/entities/product/model/types'
import { lookupsApi } from '@/shared/api/lookups-api'
import type { LookupItem } from '@/shared/types/lookup'

export const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<LookupItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [inStock, setInStock] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    lookupsApi.list('categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setError('')
    productsApi
      .list({
        search_query: searchQuery.trim() || undefined,
        category_id: categoryId === '' ? undefined : categoryId,
        min_price: minPrice === '' ? undefined : minPrice,
        max_price: maxPrice === '' ? undefined : maxPrice,
        in_stock: inStock || undefined,
      })
      .then((data) => setProducts(data.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить каталог'))
  }, [searchQuery, categoryId, minPrice, maxPrice, inStock])

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryId('')
    setMinPrice('')
    setMaxPrice('')
    setInStock(false)
  }

  return (
    <section className="stack">
      <div className="hero card">
        <h1>Каталог обуви</h1>
      </div>
      <div className="card filters-card stack">
        <div className="filters-grid">
          <label className="stack field">
            <span>Поиск</span>
            <input
              placeholder="Название или артикул"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <label className="stack field">
            <span>Категория</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name ?? `#${category.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="stack field">
            <span>Цена от</span>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
            />
          </label>

          <label className="stack field">
            <span>Цена до</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
            />
          </label>
        </div>

        <div className="filters-actions">
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <span>Только в наличии</span>
          </label>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            Сбросить фильтры
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div>
        <ProductGrid products={products} />
      </div>
    </section>
  )
}
