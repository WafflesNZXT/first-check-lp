// Lightweight helper: decode a JWT payload (handles base64url) and extract basic user info from Supabase access cookie.
export type CookieUser = {
  id: string
  email?: string | null
}

function base64UrlDecode(input: string) {
  // Replace URL-safe characters
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  // Pad with '=' to make length a multiple of 4
  while (str.length % 4) str += '='
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf8')
  }
  // Fallback (unlikely on Node server): try atob if available
  if (typeof (globalThis as any).atob === 'function') {
    return (globalThis as any).atob(str)
  }
  return null
}

function parseJwtPayload(token?: string | null) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const decoded = base64UrlDecode(payload)
    if (!decoded) return null
    return JSON.parse(decoded)
  } catch (e) {
    return null
  }
}

export function getUserFromCookie(cookieStore: any): CookieUser | null {
  try {
    const access = cookieStore?.get?.('sb-access-token')?.value || cookieStore?.get('sb-access-token')?.value
    const payload = parseJwtPayload(access)
    if (!payload) return null
    if (!payload.sub || typeof payload.sub !== 'string') return null
    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
    }
  } catch (e) {
    return null
  }
}
