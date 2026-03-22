import type { Role } from '@/shared/types/role'

export type User = {
  id: number
  first_name: string
  last_name: string
  middle_name?: string | null
  email: string
  role: Role
  created_at: string
  updated_at: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  first_name: string
  last_name: string
  middle_name?: string | null
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
}
