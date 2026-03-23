import { API_BASE_URL } from '@/shared/config/env'
import { authStorage } from '@/shared/lib/auth-storage'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = authStorage.getToken()
  const isFormData = options.body instanceof FormData
  const requestBody: BodyInit | undefined =
    options.body === undefined
      ? undefined
      : isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
  })

  if (!response.ok) {
    if (response.status === 401) {
      authStorage.clear()
    }

    let message = 'Request failed'
    try {
      const data = await response.json()
      message = data.detail ?? message
    } catch {
      // Keep default message when backend has no JSON body.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
