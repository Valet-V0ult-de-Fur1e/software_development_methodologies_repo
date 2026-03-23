export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type OrderItem = {
  id: number
  product_id: number
  quantity: number
  price_at_order: number
  created_at: string
  updated_at: string
}

export type Order = {
  id: number
  order_number: string
  date_ordered: string
  date_delivered?: string | null
  pickup_point_id: number
  user_id: number
  pickup_code: string
  status: OrderStatus
  total_price: number
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export type OrderCreatePayload = {
  pickup_point_id: number
  user_id: number
  items: Array<{
    product_id: number
    quantity: number
  }>
}

export type OrderUpdatePayload = {
  pickup_point_id?: number
  status?: OrderStatus
}
