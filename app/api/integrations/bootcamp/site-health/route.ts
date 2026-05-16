import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SiteHealthStatus = 'running' | 'not_loading' | 'security_error' | 'timeout' | 'invalid_url' | 'unknown_error'

type SiteHealthUpdate = {
  auditId?: unknown
  websiteUrl?: unknown
  status?: unknown
  httpStatus?: unknown
  latencyMs?: unknown
  checkedAt?: unknown
  error?: unknown
  finalUrl?: unknown
}

const VALID_SITE_HEALTH_STATUSES = new Set<SiteHealthStatus>([
  'running',
  'not_loading',
  'security_error',
  'timeout',
  'invalid_url',
  'unknown_error',
])

function getRequestToken(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  return request.headers.get('x-audo-export-token') || bearer || ''
}

function getLimit(request: Request) {
  const { searchParams } = new URL(request.url)
  const requested = Number(searchParams.get('limit') || 100)
  if (!Number.isFinite(requested)) return 100
  return Math.max(1, Math.min(500, Math.floor(requested)))
}

function truncate(value: unknown, maxLength: number) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text || null
  return text.slice(0, maxLength)
}

function toInteger(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.round(numeric) : null
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase service configuration for bootcamp site health ETL.')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function assertBootcampToken(request: Request) {
  const configuredToken = process.env.BOOTCAMP_EXPORT_TOKEN
  if (!configuredToken) {
    return NextResponse.json(
      { error: 'Bootcamp ETL is disabled. Set BOOTCAMP_EXPORT_TOKEN to enable this temporary integration.' },
      { status: 503 }
    )
  }

  if (getRequestToken(request) !== configuredToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function GET(request: Request) {
  const tokenError = assertBootcampToken(request)
  if (tokenError) return tokenError

  try {
    const supabase = getSupabaseAdmin()
    const limit = getLimit(request)

    const { data, error } = await supabase
      .from('audits')
      .select('id,user_id,website_url,status,created_at,site_health_status,site_health_checked_at')
      .not('website_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to extract audit URLs' }, { status: 500 })
    }

    return NextResponse.json({
      schema_version: 'audo-bootcamp-site-health-v1',
      extracted_at: new Date().toISOString(),
      temporary: true,
      count: data?.length || 0,
      audits: data || [],
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to extract audit URLs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const tokenError = assertBootcampToken(request)
  if (tokenError) return tokenError

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json().catch(() => ({}))
    const updates = Array.isArray(body?.statuses) ? body.statuses as SiteHealthUpdate[] : []

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Missing statuses array' }, { status: 400 })
    }

    const results = await Promise.all(updates.slice(0, 500).map(async (update) => {
      const auditId = String(update.auditId || '').trim()
      const status = String(update.status || '').trim().toLowerCase() as SiteHealthStatus

      if (!auditId || !VALID_SITE_HEALTH_STATUSES.has(status)) {
        return { auditId, ok: false, error: 'Invalid auditId or status' }
      }

      const checkedAt = String(update.checkedAt || new Date().toISOString())
      const patch = {
        site_health_status: status,
        site_health_http_status: toInteger(update.httpStatus),
        site_health_latency_ms: toInteger(update.latencyMs),
        site_health_error: truncate(update.error, 700),
        site_health_final_url: truncate(update.finalUrl || update.websiteUrl, 1200),
        site_health_checked_at: checkedAt,
      }

      const { error } = await supabase
        .from('audits')
        .update(patch)
        .eq('id', auditId)

      return {
        auditId,
        ok: !error,
        error: error?.message || null,
      }
    }))

    return NextResponse.json({
      loaded_at: new Date().toISOString(),
      received: updates.length,
      updated: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).length,
      results,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load site health statuses' }, { status: 500 })
  }
}
