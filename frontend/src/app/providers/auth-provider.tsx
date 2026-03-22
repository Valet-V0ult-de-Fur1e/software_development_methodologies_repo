import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/shared/api/auth-api'
import { authStorage } from '@/shared/lib/auth-storage'
import type { LoginPayload, RegisterPayload, User } from '@/entities/user/model/types'
import type { Role } from '@/shared/types/role'

type AuthContextValue = {
  user: User | null
  role: Role
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const role: Role = user?.role ?? 'guest'

  const refreshMe = useCallback(async () => {
    const token = authStorage.getToken()
    if (!token) {
      setUser(null)
      return
    }

    const me = await authApi.me()
    setUser(me)
  }, [])

  useEffect(() => {
    refreshMe()
      .catch(() => {
        authStorage.clear()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [refreshMe])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    authStorage.setToken(response.access_token)
    await refreshMe()
  }, [refreshMe])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload)
    authStorage.setToken(response.access_token)
    await refreshMe()
  }, [refreshMe])

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      role,
      isLoading,
      isAuthenticated: role !== 'guest',
      login,
      register,
      logout,
      refreshMe,
    }
  }, [isLoading, login, logout, refreshMe, register, role, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
