import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const predictSchema = z.object({
  predicted_seo_score: z.number(),
  predicted_readability_score: z.number(),
  current_score: z.number(),
  summary: z.string(),
  red_flags: z.array(z.string()),
})

function toSafeScore(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const content = String(body?.content || '').trim()

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required.' }), { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { object } = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: predictSchema,
      prompt: `Predict the SEO and Readability score of this content compared to a standard 85/100 benchmark. Identify potential red flags like keyword stuffing or vague CTAs.\n\nContent:\n${content.slice(0, 22000)}`,
    })

    const predictedSeoScore = toSafeScore(object.predicted_seo_score)
    const predictedReadabilityScore = toSafeScore(object.predicted_readability_score)
    const currentScore = object.current_score ? toSafeScore(object.current_score) : 85

    return new Response(
      JSON.stringify({
        predicted_seo_score: predictedSeoScore,
        predicted_readability_score: predictedReadabilityScore,
        predicted_score: Math.round((predictedSeoScore + predictedReadabilityScore) / 2),
        current_score: currentScore,
        summary: object.summary,
        red_flags: Array.isArray(object.red_flags) ? object.red_flags : [],
      }),
      { status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error?.message || error || 'Prediction failed') }), { status: 500 })
  }
}
