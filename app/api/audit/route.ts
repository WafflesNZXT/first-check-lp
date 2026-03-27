import { google } from '@ai-sdk/google';
import { generateObject } from 'ai'; 
import { z } from 'zod'; 
import { createClient } from '@supabase/supabase-js';

// Use the SERVICE_ROLE_KEY if you have it, to bypass RLS for administrative updates
// If not, ensure your RLS policy allows updates for authenticated users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const auditSchema = z.object({
  summary: z.string().describe("A 2-3 sentence high-level punchy roast."),
  performance_score: z.number(),
  seo_score: z.number(),
  ux_score: z.number(),
  checklist: z.array(z.object({
    issue: z.string().describe("The problem found"),
    fix: z.string().describe("The exact technical or design step to fix it"),
    selector: z.string().describe("Most specific CSS selector targeting the affected element (e.g. #header, .btn-primary, nav > ul > li:nth-child(2))"),
    code_example: z.string().describe("A practical 5-6 line code snippet implementing the fix in the site's likely stack/framework"),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.enum(['ux', 'seo', 'performance', 'copy'])
  })).describe("A list of 5-8 actionable tasks to improve the site"),
})

function buildPrompt(url: string, siteContent: string) {
  return `Analyze ${url} based on this content: ${siteContent.substring(0, 20000)}. 
           Provide a brief 2-3 sentence roast. 
           Then, generate a high-clarity checklist of the most critical fixes. 
           Each fix must be specific and actionable.
           For EVERY checklist item include:
           - selector: the exact CSS selector where the issue exists.
           - code_example: 5-6 lines of copy-paste-ready code tailored to the most likely framework/language detected from the page content (HTML/CSS/JS/React/Next/Tailwind/etc).
           Keep code_example concise, valid, and directly tied to the selector.`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractErrorStatus(error: unknown) {
  const candidate = error as { statusCode?: unknown; status?: unknown; cause?: { statusCode?: unknown; status?: unknown } }
  const values = [candidate?.statusCode, candidate?.status, candidate?.cause?.statusCode, candidate?.cause?.status]

  for (const value of values) {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return undefined
}

function isRetryableGeminiError(error: unknown) {
  const status = extractErrorStatus(error)
  if (status === 429 || status === 503) return true

  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return (
    message.includes('429')
    || message.includes('503')
    || message.includes('resource exhausted')
    || message.includes('high demand')
    || message.includes('service unavailable')
    || message.includes('temporarily unavailable')
  )
}

function isMissingColumnError(error: unknown, columnName: string) {
  const message = String((error as { message?: string })?.message || '').toLowerCase()
  return message.includes(`could not find the '${columnName.toLowerCase()}' column`)
}

function withoutErrorMessage<T extends Record<string, unknown>>(payload: T) {
  const next = { ...payload }
  delete next.error_message
  return next
}

function toIntegerScore(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

async function updateAuditById(auditId: string, payload: Record<string, unknown>) {
  const firstAttempt = await supabase.from('audits').update(payload).eq('id', auditId)
  if (!firstAttempt.error) return

  if (isMissingColumnError(firstAttempt.error, 'error_message') && 'error_message' in payload) {
    const fallbackPayload = withoutErrorMessage(payload)
    await supabase.from('audits').update(fallbackPayload).eq('id', auditId)
  }
}

async function runAuditGeneration(url: string, siteContent: string, modelName: string) {
  const { object } = await generateObject({
    model: google(modelName),
    schema: auditSchema,
    prompt: buildPrompt(url, siteContent),
  })

  return object
}

async function runAuditGenerationWithRetry(
  url: string,
  siteContent: string,
  onFallbackStart?: () => Promise<void> | void
) {
  const primaryModel = 'gemini-3.1-flash-lite-preview'
  const fallbackModel = 'gemini-2.5-flash-lite'
  const maxAttempts = 3
  const baseDelayMs = 1200

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await runAuditGeneration(url, siteContent, primaryModel)
    } catch (error) {
      if (!isRetryableGeminiError(error)) throw error
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * (2 ** (attempt - 1))
        await sleep(delay)
      }
    }
  }

  try {
    if (onFallbackStart) {
      await onFallbackStart()
    }
    return await runAuditGeneration(url, siteContent, fallbackModel)
  } catch (fallbackError) {
    const finalMessage = String((fallbackError as { message?: string })?.message || fallbackError || 'Unknown model error')
    throw new Error(`Failed after ${maxAttempts} attempts with ${primaryModel} and fallback ${fallbackModel}. Last error: ${finalMessage}`)
  }
}

export async function POST(req: Request) {
  let auditId: string | undefined = undefined
  try {
    const body = await req.json()
    const { url } = body
    auditId = body.auditId
    
    console.log(`🚀 Starting audit for: ${url} (ID: ${auditId})`);

    // 1. SCRAPE THE CONTENT (Crucial: This is how the AI "sees" the site)
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`);
    const siteContent = await jinaResponse.text();

    // 2. Generate the Screenshot URL
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noScroll/https://${url.replace('https://', '')}`;

    // 3. Run the AI with Structured Output + retries/fallback
    const fallbackNotice = 'High demand in primary model, falling back to lighter version.'
    const auditData = await runAuditGenerationWithRetry(url, siteContent, async () => {
      if (!auditId) return
      await updateAuditById(auditId, { error_message: fallbackNotice, status: 'processing' })
    })

    const performanceScore = toIntegerScore(auditData.performance_score)
    const seoScore = toIntegerScore(auditData.seo_score)
    const uxScore = toIntegerScore(auditData.ux_score)

    // 4. Update Supabase
    const completionPayload: Record<string, unknown> = {
      report_content: {
        summary: auditData.summary,
        checklist: auditData.checklist
      },
      performance_score: performanceScore,
      seo_score: seoScore,
      ux_score: uxScore,
      screenshot_url: screenshotUrl,
      error_message: null,
      status: 'completed'
    }

    let { data, error } = await supabase
      .from('audits')
      .update(completionPayload)
      .eq('id', auditId)
      .select('id, user_id')
      .maybeSingle();

    if (error && isMissingColumnError(error, 'error_message')) {
      const retry = await supabase
        .from('audits')
        .update(withoutErrorMessage(completionPayload))
        .eq('id', auditId)
        .select('id, user_id')
        .maybeSingle()

      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error("❌ Supabase Update Error:", error.message);
      if (auditId) {
        await updateAuditById(auditId, { status: 'failed', error_message: error.message })
      }
      throw new Error(error.message);
    }

    if (data?.user_id) {
      const { data: profile, error: profileReadError } = await supabase
        .from('profiles')
        .select('audit_count')
        .eq('id', data.user_id)
        .maybeSingle()

      if (profileReadError) {
        console.warn('read profile audit_count error', profileReadError)
      } else {
        const nextAuditCount = (profile?.audit_count ?? 0) + 1
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ audit_count: nextAuditCount })
          .eq('id', data.user_id)

        if (profileUpdateError) {
          console.warn('update profile audit_count error', profileUpdateError)
        }
      }
    }

    console.log("✅ Audit successfully saved to DB");
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("🚨 AUDIT ERROR:", error.message);
    if (auditId) {
      try {
        await updateAuditById(auditId, { status: 'failed', error_message: error.message })
      } catch (e) {
        console.error('failed to mark audit failed in DB', e)
      }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}