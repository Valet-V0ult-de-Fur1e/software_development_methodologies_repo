import type { Product, ProductListResponse, ProductPayload } from '@/entities/product/model/types'
import { apiRequest } from '@/shared/api/client'

export const productsApi = {
  list: () => apiRequest<ProductListResponse>('/products/?page=1&size=100'),
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
}
