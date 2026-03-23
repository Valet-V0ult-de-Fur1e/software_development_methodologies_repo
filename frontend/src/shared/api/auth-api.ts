import type { LoginPayload, LoginResponse, RegisterPayload, User } from '@/entities/user/model/types'
import { apiRequest } from '@/shared/api/client'

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiRequest<LoginResponse>('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    }),
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    }),
  me: () => apiRequest<User>('/users/me'),
}
