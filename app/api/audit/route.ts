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

    // 3. Run the AI with Structured Output
    const { object: auditData } = await generateObject({
  model: google('gemini-3.1-flash-lite-preview'),
  schema: z.object({
    summary: z.string().describe("A 2-3 sentence high-level punchy roast."),
    performance_score: z.number(),
    seo_score: z.number(),
    ux_score: z.number(),
    // THIS IS THE NEW ENGINE
    checklist: z.array(z.object({
      issue: z.string().describe("The problem found"),
      fix: z.string().describe("The exact technical or design step to fix it"),
      priority: z.enum(['high', 'medium', 'low']),
      category: z.enum(['ux', 'seo', 'performance', 'copy'])
    })).describe("A list of 5-8 actionable tasks to improve the site"),
  }),
  prompt: `Analyze ${url} based on this content: ${siteContent.substring(0, 20000)}. 
           Provide a brief 2-3 sentence roast. 
           Then, generate a high-clarity checklist of the most critical fixes. 
           Each fix must be specific and actionable.`,
});

    // 4. Update Supabase
    const { data, error } = await supabase
      .from('audits')
      .update({
        report_content: { 
          summary: auditData.summary,
          checklist: auditData.checklist
        },
        performance_score: auditData.performance_score,
        seo_score: auditData.seo_score,
        ux_score: auditData.ux_score,
        screenshot_url: screenshotUrl,
        status: 'completed'
      })
      .eq('id', auditId)
      .select();

    if (error) {
      console.error("❌ Supabase Update Error:", error.message);
      // persist failure state
      await supabase.from('audits').update({ status: 'failed', error_message: error.message }).eq('id', auditId)
      throw new Error(error.message);
    }

    console.log("✅ Audit successfully saved to DB");
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("🚨 AUDIT ERROR:", error.message);
    if (auditId) {
      try {
        await supabase.from('audits').update({ status: 'failed', error_message: error.message }).eq('id', auditId)
      } catch (e) {
        console.error('failed to mark audit failed in DB', e)
      }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}