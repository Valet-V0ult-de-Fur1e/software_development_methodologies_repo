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

        return (
          <article key={product.id} className="card product-card">
            {photoUrl ? <img src={photoUrl} alt={product.name} className="product-image" /> : <div className="product-image image-placeholder">Нет фото</div>}
            <h3>{product.name}</h3>
            <p className="muted">Артикул: {product.article}</p>
            <p>{Number(product.price).toFixed(2)} ₽</p>
            <div className="row">
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
