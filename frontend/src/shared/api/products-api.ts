import type { Product, ProductListFilters, ProductListResponse, ProductPayload } from '@/entities/product/model/types'
import { apiRequest } from '@/shared/api/client'

const buildListPath = (filters: ProductListFilters = {}) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    params.set(key, String(value))
  })

  if (!params.has('page')) {
    params.set('page', '1')
  }

  if (!params.has('size')) {
    params.set('size', '100')
  }

  return `/products/?${params.toString()}`
}

export const productsApi = {
  list: (filters?: ProductListFilters) => apiRequest<ProductListResponse>(buildListPath(filters)),
  getById: (id: number) => apiRequest<Product>(`/products/${id}`),
  create: (payload: ProductPayload) =>
    apiRequest<Product>('/products/', {
      method: 'POST',
      body: payload,
    }),
  update: (id: number, payload: Partial<ProductPayload>) =>
    apiRequest<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  remove: (id: number) =>
    apiRequest<{ detail: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  uploadPhotos: (id: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('photos', file))
    return apiRequest<Product>(`/products/${id}/photos`, {
      method: 'POST',
      body: formData,
    })
  },
  removePhoto: (productId: number, photoId: number) =>
    apiRequest<Product>(`/products/${productId}/photos/${photoId}`, {
      method: 'DELETE',
    }),
}
