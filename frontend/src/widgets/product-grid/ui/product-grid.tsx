import { Link } from 'react-router-dom'
import type { Product } from '@/entities/product/model/types'
import { useAuth } from '@/app/providers/auth-provider'
import { useCart } from '@/features/cart/model/cart-store'

type Props = {
  products: Product[]
}

export const ProductGrid = ({ products }: Props) => {
  const { role } = useAuth()
  const { addToCart } = useCart()

  return (
    <div className="product-grid">
      {products.map((product) => {
        const firstPhoto = product.photos[0]?.filename
        const photoUrl = firstPhoto
          ? `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/products/photo/${firstPhoto}`
          : null
        const discount = Number(product.discount ?? 0)
        const hasDiscount = discount > 0
        const basePrice = Number(product.price)
        const discountedPrice = hasDiscount
          ? basePrice * (1 - discount / 100)
          : basePrice

        return (
          <article key={product.id} className="card product-card">
            {photoUrl ? <img src={photoUrl} alt={product.name} className="product-image" /> : <div className="product-image image-placeholder">Нет фото</div>}
            {hasDiscount && <span className="discount-badge">-{discount.toFixed(0)}%</span>}
            <div className="product-meta">
              <p className="muted">Артикул {product.article}</p>
              <h3>{product.name}</h3>
            </div>
            <div className="product-footer">
              <div className="product-prices">
                <p className="product-price">{discountedPrice.toFixed(2)} ₽</p>
                {hasDiscount && <p className="product-price-old">{basePrice.toFixed(2)} ₽</p>}
              </div>
              <p className="product-stock">В наличии: {product.stock_quantity}</p>
            </div>
            <div className="row product-actions">
              <Link className="button-link" to={`/products/${product.id}`}>
                Карточка
              </Link>
              {role !== 'guest' && role !== 'manager' && role !== 'admin' && (
                <button className="button-primary" onClick={() => addToCart(product)}>
                  В корзину
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
