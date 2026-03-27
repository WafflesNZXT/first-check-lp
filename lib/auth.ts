// Lightweight helper: decode a JWT payload (handles base64url) and extract basic user info from Supabase access cookie.
export type CookieUser = {
  id: string
  email?: string | null
}

type CookieEntry = { name: string; value: string }

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

function readCookieValue(cookieStore: any, name: string): string | null {
  try {
    return cookieStore?.get?.(name)?.value || null
  } catch {
    return null
  }
}

function readAllCookies(cookieStore: any): CookieEntry[] {
  try {
    const all = cookieStore?.getAll?.()
    if (!Array.isArray(all)) return []
    return all
      .map((entry: any) => ({ name: String(entry?.name || ''), value: String(entry?.value || '') }))
      .filter((entry) => !!entry.name)
  } catch {
    return []
  }
}

function extractAccessTokenFromValue(value?: string | null): string | null {
  if (!value) return null

  const direct = value.trim()
  if (direct.split('.').length === 3) return direct

  const maybeDecoded = (() => {
    try {
      return decodeURIComponent(direct)
    } catch {
      return direct
    }
  })()

  const attempts = [direct, maybeDecoded]
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
      if (typeof parsed?.access_token === 'string') return parsed.access_token
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    } catch {
    }

    try {
      const decoded = base64UrlDecode(candidate)
      if (!decoded) continue
      const parsed = JSON.parse(decoded)
      if (typeof parsed?.access_token === 'string') return parsed.access_token
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    } catch {
    }
  }

  return null
}

function findAccessTokenFromSupabaseCookies(cookieStore: any): string | null {
  const directAccess = readCookieValue(cookieStore, 'sb-access-token')
  if (directAccess) return directAccess

  const allCookies = readAllCookies(cookieStore)
  const authCookie = allCookies.find((cookie) => /(^sb-.*-auth-token$)|(^sb-auth-token$)/.test(cookie.name))
  if (authCookie) {
    return extractAccessTokenFromValue(authCookie.value)
  }

  return null
}

export function getUserFromCookie(cookieStore: any): CookieUser | null {
  try {
    const access = findAccessTokenFromSupabaseCookies(cookieStore)
    const payload = parseJwtPayload(access)
    if (!payload) return null
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return null
    if (!payload.sub || typeof payload.sub !== 'string') return null
    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
    }
  } catch {
    return null
  }
}
