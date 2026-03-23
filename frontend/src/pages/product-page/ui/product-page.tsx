import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productsApi } from '@/shared/api/products-api'
import type { Product } from '@/entities/product/model/types'

export const ProductPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) {
      return
    }

    productsApi
      .getById(Number(id))
      .then(setProduct)
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Не удалось загрузить карточку'))
  }, [id])

  const shareUrl = useMemo(() => `${window.location.origin}/products/${id}`, [id])

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Ссылка скопирована')
    } catch {
      setMessage('Не удалось скопировать ссылку')
    }
  }

  if (!product) {
    return <section className="card">{message || 'Загрузка...'}</section>
  }

  const photo = product.photos[0]?.filename
  const photoUrl = photo
    ? `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/products/photo/${photo}`
    : null

  return (
    <section className="card stack">
      <h1>{product.name}</h1>
      {photoUrl ? <img src={photoUrl} alt={product.name} className="detail-image" /> : null}
      <p>{product.description || 'Описание отсутствует.'}</p>
      <p>Цена: {Number(product.price).toFixed(2)} ₽</p>
      <p>Остаток: {product.stock_quantity}</p>
      <button className="button-primary" onClick={onShare}>
        Поделиться ссылкой
      </button>
      {message && <p>{message}</p>}
    </section>
  )
}
