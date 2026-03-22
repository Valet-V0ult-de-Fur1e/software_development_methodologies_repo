import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'
import { hasRequiredRole } from '@/shared/types/role'
import type { Role } from '@/shared/types/role'

export const ProtectedRoute = ({ requiredRole }: { requiredRole: Role }) => {
  const { role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="card">Проверка доступа...</div>
  }

  if (!hasRequiredRole(role, requiredRole)) {
    return <Navigate to="/" state={{ from: location, openAuthModal: true }} replace />
  }

  return <Outlet />
}
