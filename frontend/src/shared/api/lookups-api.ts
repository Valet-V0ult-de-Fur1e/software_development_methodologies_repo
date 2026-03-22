import type { LookupItem } from '@/shared/types/lookup'
import { apiRequest } from '@/shared/api/client'

export type LookupKind = 'suppliers' | 'manufacturers' | 'categories' | 'units' | 'pickup-points'

const mapPayload = (kind: LookupKind, draft: LookupItem) => {
  if (kind === 'pickup-points') {
    return {
      postal_code: draft.postal_code,
      city: draft.city,
      street: draft.street,
      house_number: draft.house_number,
    }
  }

  if (kind === 'manufacturers') {
    return {
      name: draft.name,
      country: draft.country,
    }
  }

  if (kind === 'suppliers') {
    return {
      name: draft.name,
      phone: draft.phone,
      email: draft.email,
    }
  }

  return {
    name: draft.name,
  }
}

export const lookupsApi = {
  list: (kind: LookupKind) => apiRequest<LookupItem[]>(`/${kind}/`),
  create: (kind: LookupKind, draft: LookupItem) =>
    apiRequest<LookupItem>(`/${kind}/`, {
      method: 'POST',
      body: mapPayload(kind, draft),
    }),
  update: (kind: LookupKind, id: number, draft: LookupItem) =>
    apiRequest<LookupItem>(`/${kind}/${id}`, {
      method: 'PATCH',
      body: mapPayload(kind, draft),
    }),
  remove: (kind: LookupKind, id: number) =>
    apiRequest<{ detail: string }>(`/${kind}/${id}`, {
      method: 'DELETE',
    }),
}
