import { NextResponse } from 'next/server'

type ButterbaseAudit = {
  id: string
  url: string
  status: string
  result: string
  errors: unknown
  model: string | null
  created_at: string
}

function buildButterbaseUrl() {
  const appId = process.env.BUTTERBASE_APP_ID
  const baseUrl = process.env.BUTTERBASE_BASE_URL || 'https://api.butterbase.ai'
  const table = process.env.BUTTERBASE_AUDITS_TABLE || 'audits'

  if (!appId) return null
  return `${baseUrl.replace(/\/$/, '')}/v1/${appId}/${table}`
}

function buildHeaders() {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const auth = process.env.BUTTERBASE_SERVICE_KEY
  if (auth) {
    headers.Authorization = `Bearer ${auth}`
  }

  return headers
}

export async function GET(request: Request) {
  const endpoint = buildButterbaseUrl()
  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing BUTTERBASE_APP_ID environment variable' },
      { status: 500 }
    )
  }

  const timeoutMs = Number(process.env.BUTTERBASE_TIMEOUT_SECONDS || '12') * 1000
  const originUrl = new URL(request.url)
  const limit = originUrl.searchParams.get('limit') || '20'
  const order = originUrl.searchParams.get('order') || 'created_at.desc'
  const headers = buildHeaders()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${endpoint}?limit=${encodeURIComponent(limit)}&order=${encodeURIComponent(order)}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : []

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch audits from Butterbase',
          details: data,
          endpoint,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(
      {
        source: 'butterbase',
        endpoint,
        count: Array.isArray(data) ? data.length : 0,
        audits: (data as ButterbaseAudit[]) || [],
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Butterbase request failed',
        details: String(error),
        endpoint,
      },
      { status: 500 }
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  const endpoint = buildButterbaseUrl()
  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing BUTTERBASE_APP_ID environment variable' },
      { status: 500 }
    )
  }

  const timeoutMs = Number(process.env.BUTTERBASE_TIMEOUT_SECONDS || '12') * 1000
  const headers = buildHeaders()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = await request.json()
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to insert audit in Butterbase',
          details: data,
          endpoint,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(
      {
        source: 'butterbase',
        endpoint,
        audit: data,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Butterbase insert request failed',
        details: String(error),
        endpoint,
      },
      { status: 500 }
    )
  } finally {
    clearTimeout(timer)
  }
}
