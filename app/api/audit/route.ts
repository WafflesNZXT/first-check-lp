import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai'; 
import { z } from 'zod'; 
import { createClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/utils/supabase/server';

// Use the SERVICE_ROLE_KEY if you have it, to bypass RLS for administrative updates
// If not, ensure your RLS policy allows updates for authenticated users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const auditSchema = z.object({
  summary: z.string().describe("A 2-3 sentence high-level punchy roast."),
  performance_score: z.number().int().min(40).max(100).describe('Integer score 40-100 for performance'),
  seo_score: z.number().int().min(40).max(100).describe('Integer score 40-100 for SEO'),
  ux_score: z.number().int().min(40).max(100).describe('Integer score 40-100 for UX'),
  checklist: z.array(z.object({
    title: z.string().describe("A short, punchy name for the bug (e.g., 'Hero Image Layout Shift')"),
    issue_description: z.string().describe('Observed evidence and why it may matter to a visitor'),
    recommendation: z.string().describe("The exact technical or design step to fix it"),
    task: z.string().describe("Duplicate of title for UI safety"),
    selector: z.string().describe("Most specific CSS selector targeting the affected element (e.g. #header, .btn-primary, nav > ul > li:nth-child(2))"),
    code_example: z.string().describe("A practical 5-6 line code snippet implementing the fix in the site's likely stack/framework"),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.enum(['ux', 'seo', 'performance', 'copy'])
  })).min(5).max(8).describe("A list of 5-8 actionable tasks to improve the site"),
  top_heaviest_assets: z.array(z.object({
    asset: z.string().describe('URL or identifier of the heavy asset'),
    type: z.enum(['image', 'script', 'font', 'other']),
    estimated_impact_ms: z.number().describe('Estimated load-time impact in milliseconds'),
    recommendation: z.string().describe('Actionable optimization recommendation such as Convert to WebP or Defer Script')
  })).max(5).describe('Up to five observed heavy assets'),
  third_party_tax: z.array(z.object({
    asset: z.string().describe('Third-party script or stylesheet URL'),
    category: z.enum(['analytics', 'ads', 'chat', 'marketing', 'other']),
    estimated_fcp_impact_ms: z.number().describe('Estimated impact on First Contentful Paint in milliseconds'),
    recommendation: z.enum(['remove', 'keep']).describe('Whether this third-party asset should be removed or kept')
  })).describe('Categorized list of third-party scripts and stylesheets with FCP impact'),
  total_third_party_weight_ms: z.number().describe('Total estimated FCP weight added by third-party assets in milliseconds'),
  wcag_issues: z.array(z.object({
    issue: z.string().describe('Accessibility issue that violates WCAG 2.1'),
    selector: z.string().describe('Specific selector of the failing element'),
    wcag_criterion: z.string().describe('WCAG 2.1 criterion reference, e.g. 1.1.1 Non-text Content'),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    fix: z.string().describe('Concrete fix recommendation')
  })).describe('WCAG 2.1 compliance issues extracted from the checklist and page analysis'),
  accessibility_fix_all: z.array(z.object({
    selector: z.string().describe('Element selector that needs accessibility metadata'),
    aria_label: z.string().optional().describe('Suggested aria-label when relevant'),
    alt_text: z.string().optional().describe('Suggested alt text when relevant')
  })).describe('Fix-all accessibility metadata suggestions for failing elements'),
})

function buildPrompt(url: string, siteContent: string, thirdPartyResources: string[]) {
  const thirdPartyBlock = thirdPartyResources.length > 0
    ? thirdPartyResources.slice(0, 60).map((entry) => `- ${entry}`).join('\n')
    : '- none found from parser'

  return `Analyze ${url} based on this content: ${siteContent.substring(0, 20000)}. 
           Provide a brief 2-3 sentence roast. 
           Then, generate a high-clarity checklist of the most critical fixes. 
           Rank findings by likely usefulness and strength of available evidence. For a messaging or CTA issue, quote the visible copy or describe its observed placement, explain the potential effect on a visitor, and propose a concrete rewrite or test. Treat conversion effects as hypotheses, not measured outcomes. Do not invent a finding when evidence is missing.
           For EACH checklist item provide a "title" (the bug name), an "issue_description" (what is breaking), and a "recommendation" (how to fix it).
           For EVERY checklist item also include:
           - selector: the exact CSS selector where the issue exists.
           - code_example: 5-6 lines of copy-paste-ready code tailored to the most likely framework/language detected from the page content (HTML/CSS/JS/React/Next/Tailwind/etc).
           Keep code_example concise, valid, and directly tied to the selector.
           Also identify the Top 5 Heaviest Assets (images, scripts, or fonts) that most impact load time based on the scraped content.
           For each heavy asset include:
           - asset: resource URL/name
           - type: image/script/font/other
           - estimated_impact_ms: integer estimate of latency impact
           - recommendation: concise optimization step (e.g., Convert to WebP, Defer Script, Subset Font).

           Third-party candidates parsed from page:
           ${thirdPartyBlock}

           From those third-party candidates, categorize each into Analytics, Ads, Chat, Marketing, or Other.
           Estimate impact on First Contentful Paint for each and provide a Remove/Keep recommendation.
           Also provide the total third-party weight in milliseconds.

           Accessibility requirements:
           - Identify WCAG 2.1 violations from the checklist and page analysis.
           - Mark severity (critical/high/medium/low).
           - Provide selectors and precise fixes.
             - Build a fix-all accessibility metadata list containing aria-label and alt-text suggestions for failing elements.

             CRITICAL INSTRUCTIONS:
             1. DO NOT use Markdown headers (###) or tables (|---|) inside JSON strings.
             2. Provide RAW TEXT only for descriptions (no markdown, no headings, no tables).
             3. You MUST provide integer numeric scores between 40 and 100 for 'performance_score', 'seo_score', and 'ux_score'.
             4. Include only observed assets and supported accessibility findings. Use empty arrays when there is no evidence and use zero for the total estimate when there are no third-party entries.
             5. Structure the 'checklist' with exactly 5 distinct objects. DO NOT merge multiple fixes into a single object.
             6. Return only a single top-level JSON object — no surrounding markdown, explanations, or headings.
             7. Keep arrays present. If a selector or the implementation stack cannot be confirmed, use an empty string for the selector or code example instead of guessing.
            `
}

function extractAttributeTagUrls(content: string, tagName: 'script' | 'link', attributeName: 'src' | 'href') {
  const urls: string[] = []
  const regex = new RegExp(`<${tagName}[^>]*${attributeName}=["']([^"']+)["'][^>]*>`, 'gim')
  let match: RegExpExecArray | null = regex.exec(content)
  while (match) {
    const value = String(match[1] || '').trim()
    if (value) urls.push(value)
    match = regex.exec(content)
  }
  return urls
}

function extractLikelyExternalResourceUrls(content: string) {
  const urls: string[] = []
  const regex = /(https?:\/\/[^\s"'<>]+\.(js|css|woff2?|ttf|otf))(\?[^\s"'<>]*)?/gim
  let match: RegExpExecArray | null = regex.exec(content)
  while (match) {
    const value = String(match[0] || '').trim()
    if (value) urls.push(value)
    match = regex.exec(content)
  }
  return urls
}

function extractThirdPartyResources(pageUrl: string, siteContent: string) {
  let pageHost = ''
  try {
    pageHost = new URL(pageUrl.startsWith('http') ? pageUrl : `https://${pageUrl}`).hostname
  } catch {
    pageHost = ''
  }

  const raw = [
    ...extractAttributeTagUrls(siteContent, 'script', 'src'),
    ...extractAttributeTagUrls(siteContent, 'link', 'href'),
    ...extractLikelyExternalResourceUrls(siteContent),
  ]

  const normalized = raw
    .map((entry) => {
      try {
        const parsed = new URL(entry)
        if (!/^https?:$/.test(parsed.protocol)) return null
        if (pageHost && parsed.hostname === pageHost) return null
        parsed.hash = ''
        return parsed.toString()
      } catch {
        return null
      }
    })
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set(normalized)).slice(0, 80)
}

function isAgentSupplementEnabled() {
  return false
}

async function runAgentSupplement(url: string) {
  if (!isAgentSupplementEnabled()) return null

  const configuredBridge = String(process.env.AGENT_BRIDGE_URL || '').trim()
  const bridgeBases = Array.from(new Set([
    configuredBridge,
    'http://127.0.0.1:8000',
    'http://[::1]:8000',
    'http://localhost:8000',
  ].map((base) => base.replace(/\/$/, '')).filter(Boolean)))

  const timeoutMs = Number(process.env.AUDIT_AGENT_SUPPLEMENT_TIMEOUT_MS || '120000')
  const timeoutPerAttempt = Number.isFinite(timeoutMs) ? Math.max(10_000, Math.floor(timeoutMs / Math.max(1, bridgeBases.length))) : 120000
  const attemptErrors: string[] = []

  try {
    for (const bridgeBase of bridgeBases) {
      const endpoint = `${bridgeBase}/run-audit?url=${encodeURIComponent(url)}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutPerAttempt)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        })

        const raw = await response.text()
        let payload: Record<string, unknown> | null = null
        try {
          payload = raw ? JSON.parse(raw) : null
        } catch {
          payload = { log: raw }
        }

        if (!response.ok) {
          return {
            ok: false,
            endpoint,
            status: response.status,
            error: payload,
          }
        }

        return {
          ok: true,
          endpoint,
          status: response.status,
          status_label: String(payload?.status || ''),
          model: String(payload?.model || ''),
          log: String(payload?.log || ''),
          errors: payload?.errors ?? [],
        }
      } catch (error) {
        attemptErrors.push(`${endpoint}: ${String(error)}`)
      } finally {
        clearTimeout(timer)
      }
    }

    return {
      ok: false,
      attempted_endpoints: bridgeBases,
      error: attemptErrors.length > 0
        ? `Unable to reach agent bridge. Attempts: ${attemptErrors.join(' | ')}`
        : 'Unable to reach agent bridge.',
    }
  } catch (error) {
    return {
      ok: false,
      attempted_endpoints: bridgeBases,
      error: String(error),
    }
  }
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

async function updateProcessingAudit(auditId: string, userId: string, payload: Record<string, unknown>) {
  const firstAttempt = await supabase.from('audits').update(payload).eq('id', auditId).eq('user_id', userId).eq('status', 'processing')
  if (!firstAttempt.error) return

  if (isMissingColumnError(firstAttempt.error, 'error_message') && 'error_message' in payload) {
    const fallbackPayload = withoutErrorMessage(payload)
    await supabase.from('audits').update(fallbackPayload).eq('id', auditId).eq('user_id', userId).eq('status', 'processing')
  }
}

async function runAuditGeneration(url: string, siteContent: string, modelName: string) {
  const thirdPartyResources = extractThirdPartyResources(url, siteContent)
  const prompt = buildPrompt(url, siteContent, thirdPartyResources)

  function sanitizeAIResponse(raw: string) {
    if (!raw) return raw
    const first = raw.indexOf('{')
    const last = raw.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last >= first) return raw.slice(first, last + 1).trim()
    return raw.trim()
  }

  function parseMarkdownChecklist(markdown: string) {
    const candidate: any = {
      summary: undefined,
      performance_score: 0,
      seo_score: 0,
      ux_score: 0,
      checklist: [],
      top_heaviest_assets: [],
      third_party_tax: [],
      total_third_party_weight_ms: 0,
      wcag_issues: [],
      accessibility_fix_all: [],
    }

    const roastMatch = markdown.match(/###\s*Roast[\s\S]*?\n([\s\S]*?)(?:\n---|\n###|\n\n#|$)/i)
    if (roastMatch) candidate.summary = roastMatch[1].trim().split('\n').map((s: string) => s.trim()).join(' ')

    const fixesSectionMatch = markdown.match(/###\s*Critical Fixes[\s\S]*/i)
    const fixesText = fixesSectionMatch ? fixesSectionMatch[0] : markdown

    const itemBlocks = fixesText.split(/^\s*\d+\.\s+/m).map((s: string) => s.trim()).filter(Boolean)

    function shortDescription(text: string): string | undefined {
      if (!text) return undefined
      const s = text.replace(/\s+/g, ' ').trim()
      const match = s.match(/(.+?[\.\!\?])\s+/)
      if (match) return match[1].trim()
      return s.length > 140 ? s.slice(0, 137) + '...' : s
    }

    for (const block of itemBlocks) {
      const titleMatch = block.match(/Title:\s*([^\n\*\r]+)/i) || block.match(/\*\*Title:\s*([^\*]+)/i)
      let title = titleMatch ? titleMatch[1].trim().replace(/\*+/g, '').trim() : undefined

      const issueMatch = block.match(/issue_description:\s*([^\n\r]+)/i) || block.match(/\*\*issue_description:\*\*\s*([^\n\r]+)/i)
      let issue_description = issueMatch ? issueMatch[1].trim().replace(/\*+/g, '').trim() : undefined

      const recMatch = block.match(/recommendation:\s*([^\n\r]+)/i) || block.match(/\*\*recommendation:\*\*\s*([^\n\r]+)/i) || block.match(/Fix:\s*([^\n\r]+)/i)
      const recommendation = recMatch ? recMatch[1].trim().replace(/\*+/g, '').trim() : undefined

      const selMatch = block.match(/selector:\s*([^\n\r]+)/i) || block.match(/\*\*selector:\*\*\s*([^\n\r]+)/i)
      const selector = selMatch ? selMatch[1].trim().replace(/\*+/g, '').trim() : undefined

      const codeMatch = block.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
      const code_example = codeMatch ? codeMatch[1].trim() : undefined

      // Heuristics: if no explicit title, use the first short line as title
      if (!title) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          const first = lines[0]
          if (first.length < 100 && !first.toLowerCase().startsWith('recommend') && !first.toLowerCase().startsWith('fix') && !first.includes(':')) {
            title = first.replace(/\*+/g, '')
          }
        }
      }

      // If no explicit issue_description, take a short sentence from the block (excluding title/recommendation lines)
      if (!issue_description) {
        const withoutCode = block.replace(/```[\s\S]*?```/g, '')
        const lines = withoutCode.split('\n').map(l => l.trim()).filter(Boolean)
        const candidateLines = lines.filter(l => !(l.toLowerCase().startsWith('recommend') || l.toLowerCase().startsWith('fix') || l.toLowerCase().startsWith('title') || l.toLowerCase().startsWith('selector')))
        if (candidateLines.length > 0) {
          const firstGood = candidateLines[0]
          issue_description = shortDescription(firstGood)
        }
      }

      if (title || issue_description || recommendation) {
        candidate.checklist.push({
          title: title ?? (issue_description ? (issue_description.slice(0, 60) + (issue_description.length > 60 ? '...' : '')) : 'Untitled issue'),
          issue_description: issue_description ?? null,
          recommendation: recommendation ?? null,
          task: title ?? (issue_description ? issue_description : 'Untitled issue'),
          selector: selector ?? null,
          code_example: code_example ?? null,
          severity: 'medium',
          category: null,
          raw: block,
        })
      }
    }

    return candidate
  }

  try {
    const { object } = await generateObject({ model: google(modelName), schema: auditSchema, prompt })
    return object
  } catch (objectError) {
    console.warn('generateObject failed:', (objectError as any)?.message || objectError)

    try {
      const gen = await generateText({ model: google(modelName), prompt })
      const rawText = (gen as any)?.text ?? (gen as any)?.output ?? String(gen)
      console.error('Raw Gemini response (first 2000 chars):', String(rawText).slice(0, 2000))

      let sanitized = sanitizeAIResponse(String(rawText))
      if (!sanitized || !sanitized.trim().startsWith('{')) {
        sanitized = String(rawText).replace(/```[\s\S]*?```/g, '').replace(/^#+\s.*$/gm, '').trim()
      }

      try {
        const parsed = JSON.parse(sanitized)
        return parsed as unknown as Record<string, unknown>
      } catch (parseErr) {
        console.warn('JSON.parse failed on sanitized text, attempting markdown salvage')
        const candidate = parseMarkdownChecklist(String(rawText))
        if (candidate.checklist && candidate.checklist.length > 0) return candidate as unknown as Record<string, unknown>
        throw parseErr
      }
    } catch (fallbackErr) {
      throw new Error(`generateObject failed: ${(objectError as any)?.message || objectError}; fallback error: ${(fallbackErr as any)?.message || fallbackErr}`)
    }
  }
}

export async function POST(request: Request) {
  let url = ''
  let auditId: string | null = null
  let userId: string | null = null
  let agentProgressTimer: ReturnType<typeof setInterval> | null = null
  try {
    const body = await request.json()
    if (typeof body?.auditId !== 'string' || !body.auditId.trim()) {
      return Response.json({ error: 'An audit ID is required.' }, { status: 400 })
    }

    const signedInClient = await getServerSupabase()
    const { data: { user } } = await signedInClient.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Sign in to run an audit.' }, { status: 401 })
    }

    const { data: audit, error: lookupError } = await signedInClient
      .from('audits')
      .select('id,website_url,status')
      .eq('id', body.auditId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (lookupError) {
      console.error('Unable to look up audit:', lookupError.message)
      return Response.json({ error: 'Unable to look up audit.' }, { status: 500 })
    }
    if (!audit) {
      return Response.json({ error: 'Audit not found.' }, { status: 404 })
    }
    if (audit.status !== 'processing') {
      return Response.json({ error: 'This audit is no longer processing.' }, { status: 409 })
    }

    auditId = audit.id
    const ownerId = user.id
    userId = ownerId
    const target = String(audit.website_url ?? '').trim()
    if (!target) throw new Error('Enter a website URL before running an audit.')
    const targetUrl = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`)
    url = targetUrl.href

    console.log(`🚀 Starting audit for: ${url} (ID: ${auditId})`);

    if (auditId) {
      await updateProcessingAudit(auditId, ownerId, { status: 'processing', error_message: 'Initializing audit pipeline and preparing crawl...' })
    }

    // 1. SCRAPE THE CONTENT (Crucial: This is how the AI "sees" the site)
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, { signal: AbortSignal.timeout(25_000) });
    if (!jinaResponse.ok) {
      throw new Error('Unable to read this website. Check that the URL is public and try again.')
    }
    const siteContent = await jinaResponse.text();
    if (!siteContent.trim()) throw new Error('No readable content was found on this website.')

    if (auditId) {
      await updateProcessingAudit(auditId, ownerId, { status: 'processing', error_message: 'Crawler complete. Analyzing SEO, UX hierarchy, and conversion signals...' })
    }

    // 2. Generate the Screenshot URL
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noScroll/${url}`;

    // 3. Run the AI with Structured Output + retries/fallback
    const fallbackNotice = 'High demand in primary model, switching to lighter analysis model.'
    const auditData = await runAuditGenerationWithRetry(url, siteContent, async () => {
      if (!auditId) return
      await updateProcessingAudit(auditId, ownerId, { error_message: fallbackNotice, status: 'processing' })
    })

    const agentSupplementEnabled = isAgentSupplementEnabled()

    if (auditId && agentSupplementEnabled) {
      await updateProcessingAudit(auditId, ownerId, { status: 'processing', error_message: 'Primary audit complete. Agent opening homepage and mapping sections...' })
    }

    const agentProgressSteps = [
      'Agent: analyzing hero section...',
      'Agent: found primary CTA(s), checking destination and clarity...',
      'Agent: reading info boxes, trust blocks, and value props...',
      'Agent: testing key button interactions and page flow...',
      'Agent: found footer and finalizing findings...',
    ]

    if (auditId && agentSupplementEnabled) {
      let stepIndex = 0
      agentProgressTimer = setInterval(() => {
        const message = agentProgressSteps[Math.min(stepIndex, agentProgressSteps.length - 1)]
        stepIndex += 1
        void updateProcessingAudit(auditId as string, ownerId, { status: 'processing', error_message: message }).catch(() => undefined)
      }, 3200)
    }

    const agentSupplement = agentSupplementEnabled ? await runAgentSupplement(url) : null
    if (agentProgressTimer) {
      clearInterval(agentProgressTimer)
    }

    if (auditId && agentSupplementEnabled) {
      const supplementMessage = agentSupplement?.ok
        ? `Agent supplement completed (${String(agentSupplement.model || 'agent')}). Finalizing report...`
        : 'Agent supplement unavailable for this run. Finalizing core report...'
      await updateProcessingAudit(auditId, ownerId, { status: 'processing', error_message: supplementMessage })
    } else if (auditId) {
      await updateProcessingAudit(auditId, ownerId, { status: 'processing', error_message: 'Audit analysis complete. Finalizing report...' })
    }

    const performanceScore = toIntegerScore(auditData.performance_score)
    const seoScore = toIntegerScore(auditData.seo_score)
    const uxScore = toIntegerScore(auditData.ux_score)

    // 4. Update Supabase
    // Normalize checklist items to match frontend keys: task, recommendation, severity
    const normalizedChecklist = Array.isArray(auditData.checklist)
      ? auditData.checklist.map((item: any) => {
          const title = item?.title ?? item?.task ?? item?.issue ?? (typeof item === 'string' ? item : 'No title provided')
          const issue_description = item?.issue_description ?? item?.issue ?? item?.description ?? null
          const recommendation = item?.recommendation ?? item?.fix ?? item?.solution ?? null
          const code_example = item?.code_example ?? item?.codeExample ?? item?.code ?? null
          const severity = item?.severity ?? item?.priority ?? 'medium'

          return {
            title,
            issue_description,
            recommendation,
            task: title, // duplicate for safety
            selector: item?.selector ?? item?.sel ?? null,
            code_example,
            severity,
            category: item?.category ?? null,
            raw: item,
            // Frontend expects `issue` and `fix` fields
            issue: title ?? issue_description ?? (typeof item === 'string' ? item : 'No title provided'),
            fix: recommendation ?? issue_description ?? null,
            priority: severity,
          }
        })
      : []

    // Deduplicate top_heaviest_assets by `asset` (keep highest estimated_impact_ms)
    const rawTopAssets = Array.isArray(auditData.top_heaviest_assets) ? auditData.top_heaviest_assets : []
    const topAssetsMap = new Map<string, any>()
    for (const a of rawTopAssets) {
      const key = String(a?.asset ?? '').trim()
      if (!key) continue
      const existing = topAssetsMap.get(key)
      const aImpact = Number(a?.estimated_impact_ms) || 0
      const existingImpact = existing ? Number(existing?.estimated_impact_ms) || 0 : 0
      if (!existing || aImpact > existingImpact) topAssetsMap.set(key, a)
    }
    const dedupedTopAssets = Array.from(topAssetsMap.values())

    const completionPayload: Record<string, unknown> = {
      report_content: {
        summary: auditData.summary,
        checklist: normalizedChecklist,
        top_heaviest_assets: dedupedTopAssets,
        third_party_tax: auditData.third_party_tax,
        total_third_party_weight_ms: auditData.total_third_party_weight_ms,
        wcag_issues: auditData.wcag_issues,
        accessibility_fix_all: auditData.accessibility_fix_all,
        agent_supplement: agentSupplement,
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
      .eq('id', auditId).eq('user_id', ownerId).eq('status', 'processing')
      .select('id, user_id')
      .maybeSingle();

    if (error && isMissingColumnError(error, 'error_message')) {
      const retry = await supabase
        .from('audits')
        .update(withoutErrorMessage(completionPayload))
        .eq('id', auditId).eq('user_id', ownerId).eq('status', 'processing')
        .select('id, user_id')
        .maybeSingle()

      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error("❌ Supabase Update Error:", error.message);
      if (auditId) {
        await updateProcessingAudit(auditId, ownerId, { status: 'failed', error_message: error.message })
      }
      throw new Error(error.message);
    }

    if (!data) {
      return Response.json({ error: 'This audit is no longer processing.' }, { status: 409 })
    }

    if (data.user_id) {
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
    if (auditId && userId) {
      try {
        await updateProcessingAudit(auditId, userId, { status: 'failed', error_message: error.message })
      } catch (e) {
        console.error('failed to mark audit failed in DB', e)
      }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    if (agentProgressTimer) clearInterval(agentProgressTimer)
  }
}

async function runAuditGenerationWithRetry(url: string, siteContent: string, onFallback?: () => Promise<void> | void) {
  const primary = 'gemini-3.1-flash-lite-preview'
  const fallback = 'gemini-2.5-flash-lite'
  try {
    return await runAuditGeneration(url, siteContent, primary)
  } catch (err) {
    console.warn('Primary model failed, attempting fallback model:', (err as any)?.message || err)
    if (onFallback) await onFallback()
    return await runAuditGeneration(url, siteContent, fallback)
  }
}
