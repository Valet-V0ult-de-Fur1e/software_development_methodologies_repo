import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'
import { AuthModal } from '@/widgets/auth-modal/ui/auth-modal'

export const AppLayout = () => {
  const { isAuthenticated, logout, role } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
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
        <Link to="/" className="brand">
          Shoe Store
        </Link>
        <nav className="row">
          <Link to="/">Каталог</Link>
          <Link to="/orders">Мои заказы</Link>
          {(role === 'manager' || role === 'admin') && <Link to="/manager">Менеджер</Link>}
          {role === 'admin' && <Link to="/admin">Админ</Link>}
        </nav>
        <div className="row">
          <span className="badge">{role}</span>
          {isAuthenticated ? (
            <button className="button-secondary" onClick={logout}>
              Выйти
            </button>
          ) : (
            <button className="button-secondary" onClick={() => setIsAuthModalOpen(true)}>
              Войти / Регистрация
            </button>
          )}
        </div>
      </header>
      <main className="main"><Outlet /></main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
