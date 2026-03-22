export type ProductPhoto = {
  id: number
  filename: string
  created_at: string
}

export type Product = {
  id: number
  article: string
  name: string
  unit_id: number
  price: number
  supplier_id: number
  manufacturer_id: number
  category_id: number
  discount: number
  stock_quantity: number
  description?: string | null
  photos: ProductPhoto[]
  created_at: string
  updated_at: string
}

export type ProductListResponse = {
  items: Product[]
  total: number
  page: number
  size: number
  pages: number
}

export type ProductPayload = {
  article: string
  name: string
  unit_id: number
  price: number
  supplier_id: number
  manufacturer_id: number
  category_id: number
  discount?: number
  stock_quantity: number
  description?: string
}
