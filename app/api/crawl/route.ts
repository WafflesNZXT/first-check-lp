import { NextResponse } from 'next/server'

function normalizeBaseUrl(input: string) {
  const trimmed = String(input || '').trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
}

function extractLocEntries(xml: string) {
  const links: string[] = []
  const regex = /<loc>([\s\S]*?)<\/loc>/gim
  let match: RegExpExecArray | null = regex.exec(xml)

  while (match) {
    const raw = String(match[1] || '').trim()
    if (raw) {
      links.push(
        raw
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      )
    }
    match = regex.exec(xml)
  }

  return links
}

function toInternalAbsoluteUrls(entries: string[], baseUrl: URL) {
  return entries
    .map((entry) => {
      try {
        const parsed = new URL(entry)
        if (parsed.hostname !== baseUrl.hostname) return null
        parsed.hash = ''
        return parsed.toString()
      } catch {
        return null
      }
    })
    .filter((value): value is string => Boolean(value))
}

async function fetchTextIfOk(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8',
      'User-Agent': 'audo-crawler/1.0',
    },
  })

  if (!response.ok) return null
  return response.text()
}

function extractSitemapsFromRobots(robots: string, baseUrl: URL) {
  return robots
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap\s*:/i.test(line))
    .map((line) => line.replace(/^sitemap\s*:/i, '').trim())
    .map((entry) => {
      try {
        return new URL(entry, baseUrl).toString()
      } catch {
        return null
      }
    })
    .filter((value): value is string => Boolean(value))
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const baseInput = String(body?.baseUrl || body?.url || '').trim()
    const baseUrl = normalizeBaseUrl(baseInput)

    if (!baseUrl) {
      return NextResponse.json({ error: 'Invalid base URL' }, { status: 400 })
    }

    const candidateSitemaps = [
      new URL('/sitemap.xml', baseUrl).toString(),
      new URL('/sitemap_index.xml', baseUrl).toString(),
      new URL('/wp-sitemap.xml', baseUrl).toString(),
    ]

    const robotsText = await fetchTextIfOk(new URL('/robots.txt', baseUrl).toString())
    const robotDeclared = robotsText ? extractSitemapsFromRobots(robotsText, baseUrl) : []

    const allCandidates = Array.from(new Set([...candidateSitemaps, ...robotDeclared]))

    let usedSitemap = allCandidates[0]
    let deduped: string[] = []

    for (const sitemapUrl of allCandidates) {
      const xml = await fetchTextIfOk(sitemapUrl)
      if (!xml) continue

      const rawUrls = extractLocEntries(xml)
      const internal = toInternalAbsoluteUrls(rawUrls, baseUrl)
      if (internal.length === 0) continue

      usedSitemap = sitemapUrl
      deduped = Array.from(new Set(internal))
      break
    }

    if (deduped.length === 0) {
      deduped = [baseUrl.toString()]
    }

    return NextResponse.json({
      baseUrl: baseUrl.toString(),
      sitemapUrl: usedSitemap,
      count: deduped.length,
      urls: deduped,
      warning: deduped.length === 1 && deduped[0] === baseUrl.toString()
        ? 'No crawlable sitemap entries found; showing base URL only.'
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to crawl sitemap' }, { status: 500 })
  }
}
