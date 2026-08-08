import axios, { type AxiosInstance } from 'axios'

// Browser client (used in Client Components and hooks)
export function createBrowserClient(): AxiosInstance {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      // Import lazily to avoid SSR issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Cookies = require('js-cookie')
      const token = Cookies.get(process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'hab_access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Cookies = require('js-cookie')
        Cookies.remove(process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'hab_access_token')
        window.location.href = `/login?redirect=${window.location.pathname}`
      }
      return Promise.reject(error)
    }
  )

  return client
}

// Singleton for client-side usage
let browserClient: AxiosInstance | null = null
export const getBrowserClient = () => {
  if (!browserClient) browserClient = createBrowserClient()
  return browserClient
}

// Server-side fetch (used in Server Components)
export async function serverFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
      ...options?.headers,
    },
    cache: 'no-store',   // marketplace data must always be fresh
  })

  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`)

  return res.json()
}
