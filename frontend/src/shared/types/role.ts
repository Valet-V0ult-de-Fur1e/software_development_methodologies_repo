export type Role = 'guest' | 'user' | 'manager' | 'admin'

export const roleRank: Record<Role, number> = {
  guest: 0,
  user: 1,
  manager: 2,
  admin: 3,
}

export const hasRequiredRole = (current: Role, required: Role) => {
  return roleRank[current] >= roleRank[required]
}
