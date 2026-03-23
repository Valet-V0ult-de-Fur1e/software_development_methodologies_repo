import { useEffect } from 'react'
import { CartPanel } from '@/features/cart/ui/cart-panel'

type CartModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <section
        className="card modal-window"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
      >
        <div className="row modal-header">
          <h2>Корзина</h2>
          <button type="button" className="button-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <CartPanel />
      </section>
    </div>
  )
}
