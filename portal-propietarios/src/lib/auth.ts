import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = process.env.COOKIE_NAME ?? 'hab_access_token'

export async function getTokenFromCookies(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) redirect('/login')
  return token
}

export async function getOptionalToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}
