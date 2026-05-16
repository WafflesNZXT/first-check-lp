import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AuditExportRow = {
  id: string
  user_id: string
  website_url: string | null
  status: string | null
  performance_score: number | null
  ux_score: number | null
  seo_score: number | null
  created_at: string
  screenshot_url?: string | null
  report_content?: {
    checklist?: Array<Record<string, unknown>>
    summary?: string
    [key: string]: unknown
  } | null
}

type AgentEventExportRow = {
  event_type?: string | null
  severity?: string | null
}

function getRequestToken(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  return request.headers.get('x-audo-export-token') || bearer || ''
}

function getLimit(request: Request) {
  const { searchParams } = new URL(request.url)
  const requested = Number(searchParams.get('limit') || 50)
  if (!Number.isFinite(requested)) return 50
  return Math.max(1, Math.min(250, Math.floor(requested)))
}

function average(values: Array<number | null | undefined>) {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (numeric.length === 0) return null
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length)
}

function countBy<T>(rows: T[], keyGetter: (row: T) => string | null | undefined) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = keyGetter(row) || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function getChecklistStats(audit: AuditExportRow) {
  const checklist = Array.isArray(audit.report_content?.checklist) ? audit.report_content.checklist : []
  const completed = checklist.filter((item) => Boolean(item.completed)).length

  return {
    total: checklist.length,
    completed,
    open: Math.max(0, checklist.length - completed),
  }
}

export async function GET(request: Request) {
  const configuredToken = process.env.BOOTCAMP_EXPORT_TOKEN
  if (!configuredToken) {
    return NextResponse.json(
      { error: 'Bootcamp export is disabled. Set BOOTCAMP_EXPORT_TOKEN to enable this temporary integration.' },
      { status: 503 }
    )
  }

  if (getRequestToken(request) !== configuredToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase service configuration for bootcamp export.' },
      { status: 503 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const url = new URL(request.url)
  const auditId = String(url.searchParams.get('auditId') || '').trim()
  const limit = getLimit(request)
  const format = String(url.searchParams.get('format') || 'json').toLowerCase()

  let auditQuery = supabase
    .from('audits')
    .select('id,user_id,website_url,status,performance_score,ux_score,seo_score,created_at,screenshot_url,report_content')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (auditId) {
    auditQuery = auditQuery.eq('id', auditId)
  }

  const { data: auditsData, error: auditsError } = await auditQuery

  if (auditsError) {
    return NextResponse.json({ error: auditsError.message || 'Failed to export audits' }, { status: 500 })
  }

  const audits = (auditsData || []) as AuditExportRow[]
  const auditIds = audits.map((audit) => audit.id).filter(Boolean)

  const warnings: string[] = []
  let agentSessions: unknown[] = []
  let agentEvents: AgentEventExportRow[] = []
  let workflowTasks: unknown[] = []

  if (auditIds.length > 0) {
    const [sessionsResult, eventsResult, tasksResult] = await Promise.all([
      supabase
        .from('agent_sessions')
        .select('id,audit_id,user_id,target_url,status,mode,current_url,worker_id,summary,error_message,started_at,finished_at,created_at,updated_at')
        .in('audit_id', auditIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('agent_events')
        .select('id,session_id,audit_id,user_id,event_type,message,current_url,cursor_x,cursor_y,scroll_y,screenshot_url,severity,metadata,created_at')
        .in('audit_id', auditIds)
        .order('created_at', { ascending: true })
        .limit(1500),
      supabase
        .from('audit_workflow_tasks')
        .select('id,audit_id,title,source_issue,status,priority,assigned_email,due_date,created_at,updated_at')
        .in('audit_id', auditIds)
        .order('created_at', { ascending: false }),
    ])

    if (sessionsResult.error) warnings.push(`agent_sessions: ${sessionsResult.error.message}`)
    if (eventsResult.error) warnings.push(`agent_events: ${eventsResult.error.message}`)
    if (tasksResult.error) warnings.push(`audit_workflow_tasks: ${tasksResult.error.message}`)

    agentSessions = sessionsResult.data || []
    agentEvents = (eventsResult.data || []) as AgentEventExportRow[]
    workflowTasks = tasksResult.data || []
  }

  const enrichedAudits = audits.map((audit) => ({
    ...audit,
    checklist_stats: getChecklistStats(audit),
  }))

  const payload = {
    schema_version: 'audo-bootcamp-azure-v1',
    exported_at: new Date().toISOString(),
    source: 'audo',
    integration: 'azure_data_factory_to_adls_to_databricks',
    temporary: true,
    counts: {
      audits: enrichedAudits.length,
      agent_sessions: agentSessions.length,
      agent_events: agentEvents.length,
      workflow_tasks: workflowTasks.length,
    },
    metrics: {
      completed_audits: audits.filter((audit) => audit.status === 'completed').length,
      average_performance_score: average(audits.map((audit) => audit.performance_score)),
      average_ux_score: average(audits.map((audit) => audit.ux_score)),
      average_seo_score: average(audits.map((audit) => audit.seo_score)),
      open_checklist_items: enrichedAudits.reduce((sum, audit) => sum + audit.checklist_stats.open, 0),
      event_type_counts: countBy(agentEvents, (event) => event.event_type),
      severity_counts: countBy(agentEvents, (event) => event.severity),
    },
    audits: enrichedAudits,
    agent_sessions: agentSessions,
    agent_events: agentEvents,
    workflow_tasks: workflowTasks,
    warnings,
  }

  if (format === 'ndjson') {
    const rows = [
      ...enrichedAudits.map((record) => ({ entity: 'audit', record })),
      ...agentSessions.map((record) => ({ entity: 'agent_session', record })),
      ...agentEvents.map((record) => ({ entity: 'agent_event', record })),
      ...workflowTasks.map((record) => ({ entity: 'workflow_task', record })),
    ]

    return new NextResponse(rows.map((row) => JSON.stringify(row)).join('\n'), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
