import { useEffect } from 'react'
import { ProfileForm } from '@/features/user/ui/profile-form'

type ProfileModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
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
        aria-label="Профиль"
      >
        <div className="row modal-header">
          <h2>Мой профиль</h2>
          <button type="button" className="button-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <ProfileForm />
      </section>
    </div>
  )
}
