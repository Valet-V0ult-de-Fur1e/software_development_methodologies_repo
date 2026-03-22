import type { Role } from '@/shared/types/role'
import type { User } from '@/entities/user/model/types'
import { apiRequest } from '@/shared/api/client'

type UserUpdatePayload = {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  email?: string
  role?: Role
}

export const usersApi = {
  getById: (id: number) => apiRequest<User>(`/users/${id}`),
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
