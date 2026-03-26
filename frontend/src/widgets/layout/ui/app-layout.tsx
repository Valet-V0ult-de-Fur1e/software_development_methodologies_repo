import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'
import { AuthModal } from '@/widgets/auth-modal/ui/auth-modal'
import { CartModal } from '@/widgets/cart-modal/ui/cart-modal'
import { useCart } from '@/features/cart/model/cart-store'
import { ProfileModal } from '@/widgets/profile-modal/ui/profile-modal'

export const AppLayout = () => {
  const { isAuthenticated, logout, role } = useAuth()
  const { items } = useCart()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state && (location.state as { openAuthModal?: boolean }).openAuthModal) {
      setIsAuthModalOpen(true)
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location.pathname, location.search, location.state, navigate])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="topbar-main">
          <Link to="/" className="brand">
            Shoe Store
          </Link>

          <nav className="top-nav">
            <Link to="/">Каталог</Link>
            {(role !== 'manager' && role !== 'admin') && <Link to="/orders">Мои заказы</Link>}
            {(role === 'manager' || role === 'admin') && <Link to="/manager">Менеджер</Link>}
            {role === 'admin' && <Link to="/admin">Админ</Link>}
          </nav>

          <div className="top-actions">
            {role === 'user' && (
              <button className="button-secondary" onClick={() => setIsCartModalOpen(true)}>
                Корзина <span className="badge">{items.length}</span>
              </button>
            )}
            {isAuthenticated ? (
              <>
                <button className="button-secondary" onClick={() => setIsProfileModalOpen(true)}>
                  Профиль
                </button>
                <button className="button-secondary" onClick={logout}>
                  Выйти
                </button>
              </>
            ) : (
              <button className="button-secondary" onClick={() => setIsAuthModalOpen(true)}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main"><Outlet /></main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CartModal isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  )
}
