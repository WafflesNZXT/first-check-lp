import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

function normalizeWebsiteUrl(rawUrl: unknown) {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return null

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    return parsed.toString()
  } catch {
    return null
  }
}

function toIntegerScore(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

const scoreSchema = z.object({
  performance_score: z.number().int().min(40).max(100),
  seo_score: z.number().int().min(40).max(100),
  ux_score: z.number().int().min(40).max(100),
  checklist: z.array(
    z.object({
      title: z.string(),
      recommendation: z.string().nullable().optional(),
    })
  ).min(3).max(8),
})

const scoreSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function computeBenchmarkPercentile(overallScore: number) {
  try {
    const { data, error } = await scoreSupabase
      .from('audits')
      .select('performance_score,ux_score,seo_score,status')
      .eq('status', 'completed')
      .limit(500)

    if (error || !data || data.length < 5) return null

    const dataset = data
      .map((row) => {
        const perf = toIntegerScore(row.performance_score)
        const ux = toIntegerScore(row.ux_score)
        const seo = toIntegerScore(row.seo_score)
        return Math.round((perf + ux + seo) / 3)
      })
      .filter((value) => Number.isFinite(value))

    if (dataset.length < 5) return null

    const lowerOrEqual = dataset.filter((value) => value <= overallScore).length
    return Math.round((lowerOrEqual / dataset.length) * 100)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    const normalizedUrl = normalizeWebsiteUrl(url)

    if (!normalizedUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const jinaResponse = await fetch(`https://r.jina.ai/${normalizedUrl}`)
    if (!jinaResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch page content for audit.' }, { status: 400 })
    }

    const siteContent = await jinaResponse.text()
    const prompt = `Analyze ${normalizedUrl} based on this content: ${siteContent.substring(0, 14000)}.
Return integer scores from 40-100 for performance_score, seo_score, and ux_score.
Return 3-8 concrete checklist items. Keep each title short and recommendation actionable.
Return only JSON matching the schema.`

    const { object } = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: scoreSchema,
      prompt,
    })

    const performance = toIntegerScore(object.performance_score)
    const accessibility = toIntegerScore(object.ux_score)
    const seo = toIntegerScore(object.seo_score)

    const issuePreview = Array.isArray(object.checklist)
      ? object.checklist
          .map((item) => ({
            issue: String(item?.title || '').trim(),
            fix: String(item?.recommendation || '').trim(),
          }))
          .filter((item) => item.issue)
          .slice(0, 3)
      : []

    const totalIssues = Array.isArray(object.checklist) ? object.checklist.length : issuePreview.length
    const overallScore = Math.round((performance + accessibility + seo) / 3)
    const percentile = await computeBenchmarkPercentile(overallScore)

    return NextResponse.json({
      performance,
      accessibility,
      seo,
      issues: issuePreview,
      totalIssues,
      scoreScaleMax: 100,
      benchmarkPercentile: percentile,
      benchmarkLabel: percentile == null ? null : `Better than ${percentile}% of audited sites`,
      scoreMethod: 'AI crawler audit (same scoring model as dashboard)',
    })
  } catch (err) {
    console.error('Score request failed:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}