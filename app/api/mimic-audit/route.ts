import { NextResponse } from 'next/server'

type AgentRunResponse = {
  status?: string
  log?: string
  errors?: unknown
  model?: string
  db_log?: {
    saved?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

function normalizeUrl(input: string) {
  const raw = (input || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

function buildButterbaseUrl() {
  const appId = process.env.BUTTERBASE_APP_ID
  const baseUrl = process.env.BUTTERBASE_BASE_URL || 'https://api.butterbase.ai'
  const table = process.env.BUTTERBASE_AUDITS_TABLE || 'audits'

  if (!appId) return null
  return `${baseUrl.replace(/\/$/, '')}/v1/${appId}/${table}`
}

function toErrorMessages(rawErrors: unknown): string[] {
  if (!Array.isArray(rawErrors)) return []
  return rawErrors
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
}

function getBridgeBases(): string[] {
  const configured = (process.env.AGENT_BRIDGE_URL || '').trim()
  const defaults = ['http://127.0.0.1:8000', 'http://[::1]:8000', 'http://localhost:8000']
  const candidates = configured ? [configured, ...defaults] : defaults

  return Array.from(new Set(candidates.map((base) => base.replace(/\/$/, ''))))
}

type AuditRunResult = {
  status: number
  payload: Record<string, unknown>
}

type ProgressHandler = (message: string) => void | Promise<void>

function getAuditTimeoutMs() {
  const raw = Number(process.env.MIMIC_AUDIT_TIMEOUT_MS || '480000')
  if (!Number.isFinite(raw) || raw <= 0) return 480000
  return Math.floor(raw)
}

async function runAuditWithTimeout(url: string, onProgress?: ProgressHandler): Promise<AuditRunResult> {
  const timeoutMs = getAuditTimeoutMs()

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race<AuditRunResult>([
      runAudit(url, onProgress),
      new Promise<AuditRunResult>((resolve) => {
        timeoutHandle = setTimeout(() => {
          resolve({
            status: 504,
            payload: {
              error: 'Agent run timed out',
              details: `No completion signal within ${Math.floor(timeoutMs / 1000)} seconds`,
            },
          })
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}

async function runAudit(url: string, onProgress?: ProgressHandler): Promise<AuditRunResult> {
  const bridgeBases = getBridgeBases()
  let bridgeEndpoint = ''
  let bridgeResponse: Response | null = null
  let bridgeFetchError: unknown = null

  for (const base of bridgeBases) {
    bridgeEndpoint = `${base}/run-audit?url=${encodeURIComponent(url)}`
    await onProgress?.(`Connecting to agent bridge at ${base}`)

    try {
      bridgeResponse = await fetch(bridgeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      await onProgress?.('Agent bridge accepted the run request')
      break
    } catch (error) {
      bridgeFetchError = error
      bridgeResponse = null
    }
  }

  if (!bridgeResponse) {
    return {
      status: 503,
      payload: {
        error: 'Agent bridge is unavailable',
        details: 'Could not connect to the local agent bridge. Start it and retry.',
        attempted_endpoints: bridgeBases.map((base) => `${base}/run-audit`),
        cause: String(bridgeFetchError),
      },
    }
  }

  await onProgress?.('Waiting for agent run to complete')
  const bridgeRaw = await bridgeResponse.text()
  let bridgeData: AgentRunResponse = {}
  try {
    bridgeData = bridgeRaw ? (JSON.parse(bridgeRaw) as AgentRunResponse) : {}
  } catch {
    bridgeData = { log: bridgeRaw }
  }

  if (!bridgeResponse.ok) {
    return {
      status: bridgeResponse.status,
      payload: {
        error: 'Agent bridge run failed',
        details: bridgeData,
        endpoint: bridgeEndpoint,
      },
    }
  }

  if (bridgeData?.db_log?.saved === true) {
    return {
      status: 200,
      payload: {
        ok: true,
        source: 'agent_bridge',
        audit: bridgeData,
      },
    }
  }

  const butterbaseUrl = buildButterbaseUrl()
  if (!butterbaseUrl) {
    return {
      status: 500,
      payload: {
        error: 'Missing Butterbase configuration',
        details: 'Set BUTTERBASE_APP_ID (and optionally BUTTERBASE_BASE_URL/BUTTERBASE_AUDITS_TABLE)',
      },
    }
  }

  await onProgress?.('Saving audit result to Butterbase')
  const payload = {
    url,
    status: String(bridgeData.status || 'In Progress'),
    result: String(bridgeData.log || ''),
    errors: {
      messages: toErrorMessages(bridgeData.errors),
      count: toErrorMessages(bridgeData.errors).length,
    },
    model: bridgeData.model ? String(bridgeData.model) : null,
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (process.env.BUTTERBASE_SERVICE_KEY) {
    headers.Authorization = `Bearer ${process.env.BUTTERBASE_SERVICE_KEY}`
  }

  const dbResponse = await fetch(butterbaseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const dbRaw = await dbResponse.text()
  let dbData: unknown = null
  try {
    dbData = dbRaw ? JSON.parse(dbRaw) : null
  } catch {
    dbData = dbRaw
  }

  if (!dbResponse.ok) {
    return {
      status: 500,
      payload: {
        error: 'Agent run completed but saving to Butterbase failed',
        agent: bridgeData,
        db: dbData,
      },
    }
  }

  return {
    status: 200,
    payload: {
      ok: true,
      source: 'next_api_fallback',
      audit: dbData,
      agent: bridgeData,
    },
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as { url?: string }))
  const url = normalizeUrl(String(body?.url || ''))

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const result = await runAuditWithTimeout(url)
  return NextResponse.json(result.payload, { status: result.status })
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const url = normalizeUrl(requestUrl.searchParams.get('url') || '')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writeEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      writeEvent('progress', { message: 'Starting audit run' })
      const startedAt = Date.now()
      const heartbeat = setInterval(() => {
        const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000))
        writeEvent('progress', { message: `Agent running... ${elapsedSeconds}s` })
      }, 1500)

      ;(async () => {
        try {
          const result = await runAuditWithTimeout(url, (message) => {
            writeEvent('progress', { message })
          })

          const payload = result.payload as {
            error?: string
            agent?: { log?: string; errors?: unknown; status?: string }
            audit?: { result?: string }
          }

          const resultText = String(payload?.agent?.log || payload?.audit?.result || '')
          if (resultText) {
            for (const line of resultText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
              writeEvent('line', { text: line })
            }
          }

          if (result.status >= 400) {
            writeEvent('failed', {
              message: String(payload?.error || `Audit failed (${result.status})`),
              status: result.status,
            })
            return
          }

          writeEvent('done', {
            status: result.status,
            payload: result.payload,
          })
        } catch (error) {
          writeEvent('failed', {
            message: String(error),
            status: 500,
          })
        } finally {
          clearInterval(heartbeat)
          controller.close()
        }
      })()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
