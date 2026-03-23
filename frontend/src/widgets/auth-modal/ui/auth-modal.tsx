import { useEffect } from 'react'
import { AuthWidget } from '@/features/auth/ui/auth-widget'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
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
        aria-label="Окно авторизации"
      >
        <div className="row modal-header">
          <h2>Аккаунт</h2>
          <button type="button" className="button-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <AuthWidget onSuccess={onClose} />
      </section>
    </div>
  )
}
