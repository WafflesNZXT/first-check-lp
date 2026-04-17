import { NextRequest, NextResponse } from 'next/server';

function normalizeWebsiteUrl(rawUrl: unknown) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const normalizedUrl = normalizeWebsiteUrl(url);

    if (!normalizedUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const apiKey = process.env.PAGESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=mobile&category=performance&category=accessibility&category=seo&key=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(`[Score Request] ${new Date().toISOString()} — ${normalizedUrl}`);

    if (!response.ok || data.error) {
    console.error(`[Score Error] ${new Date().toISOString()} — ${normalizedUrl} — ${data.error?.message}`);
    return NextResponse.json(
      { error: data.error?.message || 'Failed to analyze URL' },
      { status: 400 }
    );
  }

    const categories = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;

    if (!categories) {
      return NextResponse.json({ error: 'Could not analyze this URL' }, { status: 400 });
    }

    // Extract scores
    const performance = Math.round((categories.performance?.score ?? 0) * 100);
    const accessibility = Math.round((categories.accessibility?.score ?? 0) * 100);
    const seo = Math.round((categories.seo?.score ?? 0) * 100);

    // Extract a few surface-level issues for the free preview
    const issues: string[] = [];

    if (audits?.['first-contentful-paint']?.score < 0.9) {
      issues.push(`Slow first paint — ${audits['first-contentful-paint'].displayValue}`);
    }
    if (audits?.['largest-contentful-paint']?.score < 0.9) {
      issues.push(`Slow largest content load — ${audits['largest-contentful-paint'].displayValue}`);
    }
    if (audits?.['unused-javascript']?.score < 0.9) {
      issues.push('Unused JavaScript detected');
    }
    if (audits?.['unused-css-rules']?.score < 0.9) {
      issues.push('Unused CSS detected');
    }
    if (audits?.['render-blocking-resources']?.score < 0.9) {
      issues.push('Render-blocking resources slowing load');
    }
    if (audits?.['image-alt']?.score < 1) {
      issues.push('Images missing alt text');
    }
    if (audits?.['meta-description']?.score < 1) {
      issues.push('Missing meta description');
    }
    if (audits?.['document-title']?.score < 1) {
      issues.push('Missing page title tag');
    }

    return NextResponse.json({
      performance,
      accessibility,
      seo,
      issues: issues.slice(0, 3), // Only return 3 free issues
      totalIssues: issues.length,  // Hint at how many total issues exist
    });

  } catch (err) {
    console.error('PageSpeed error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}