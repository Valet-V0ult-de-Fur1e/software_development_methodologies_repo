import type { Role } from '@/shared/types/role'
import type { User } from '@/entities/user/model/types'
import { apiRequest } from '@/shared/api/client'

type UserUpdatePayload = {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  email?: string
  password?: string
  role?: Role
}

export const usersApi = {
  list: () => apiRequest<User[]>('/users/'),
  getById: (id: number) => apiRequest<User>(`/users/${id}`),
  updateMe: (payload: UserUpdatePayload) =>
    apiRequest<User>('/users/me', {
      method: 'PATCH',
      body: payload,
    }),
  updateById: (id: number, payload: UserUpdatePayload) =>
    apiRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  removeById: (id: number) =>
    apiRequest<{ detail: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
}
