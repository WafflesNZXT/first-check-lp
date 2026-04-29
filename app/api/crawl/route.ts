import { NextResponse } from 'next/server'

const MAX_SITEMAP_FILES = 24
const MAX_URL_RESULTS = 400
const MAX_LINK_CRAWL_PAGES = 35
const NON_PAGE_FILE_EXTENSIONS = new Set([
  'js', 'mjs', 'cjs', 'css', 'map', 'json', 'xml', 'txt', 'pdf',
  'webmanifest',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp', 'tiff',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'ogg',
  'zip', 'gz', 'tar', 'rar',
])

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

function normalizeInternalUrl(candidate: string, baseUrl: URL, resolveAgainst?: string) {
  try {
    const parsed = resolveAgainst ? new URL(candidate, resolveAgainst) : new URL(candidate)
    if (!/^https?:$/.test(parsed.protocol)) return null
    if (parsed.hostname !== baseUrl.hostname) return null
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

function hasNonPageFileExtension(pathname: string) {
  const cleanPath = pathname.split('?')[0].split('#')[0]
  const lastSegment = cleanPath.split('/').filter(Boolean).pop() || ''
  const dotIndex = lastSegment.lastIndexOf('.')
  if (dotIndex < 0) return false
  const extension = lastSegment.slice(dotIndex + 1).toLowerCase()
  return NON_PAGE_FILE_EXTENSIONS.has(extension)
}

function isLikelyUserFacingPage(url: string, baseUrl: URL) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== baseUrl.hostname) return false

    const path = parsed.pathname.toLowerCase()
    if (!path) return true

    if (path.startsWith('/_next/')) return false
    if (path.startsWith('/api/')) return false
    if (path.startsWith('/assets/')) return false
    if (path.startsWith('/static/')) return false
    if (path.startsWith('/images/')) return false
    if (path.startsWith('/img/')) return false
    if (path.startsWith('/fonts/')) return false
    if (path.startsWith('/media/')) return false

    if (path === '/manifest' || path === '/manifest.webmanifest') return false
    if (path === '/icon' || path === '/icon.png' || path === '/icon.jpg' || path === '/icon.jpeg' || path === '/icon.svg' || path === '/icon.ico') return false
    if (path === '/apple-icon' || path === '/apple-icon.png' || path === '/apple-icon.jpg' || path === '/apple-icon.jpeg') return false

    if (hasNonPageFileExtension(path)) return false

    return true
  } catch {
    return false
  }
}

function filterToUserFacingPages(urls: string[], baseUrl: URL) {
  const deduped = new Set<string>()

  for (const candidate of urls) {
    if (!isLikelyUserFacingPage(candidate, baseUrl)) continue

    try {
      const parsed = new URL(candidate)
      parsed.hash = ''
      const normalizedPath = parsed.pathname !== '/' ? parsed.pathname.replace(/\/+$/, '') : '/'
      parsed.pathname = normalizedPath || '/'
      const normalized = parsed.toString()
      deduped.add(normalized)
    } catch {
    }
  }

  return Array.from(deduped)
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

function isLikelySitemapFile(url: string) {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    return pathname.endsWith('.xml') || pathname.endsWith('.xml.gz') || pathname.includes('sitemap')
  } catch {
    return false
  }
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

function extractHrefEntries(html: string) {
  const links: string[] = []
  const regex = /href=["']([^"']+)["']/gim
  let match: RegExpExecArray | null = regex.exec(html)

  while (match) {
    const href = String(match[1] || '').trim()
    if (href) links.push(href)
    match = regex.exec(html)
  }

  return links
}

async function collectUrlsFromSitemaps(sitemapCandidates: string[], baseUrl: URL) {
  const sitemapQueue = [...sitemapCandidates]
  const visitedSitemaps = new Set<string>()
  const pageUrls = new Set<string>()

  while (sitemapQueue.length > 0 && visitedSitemaps.size < MAX_SITEMAP_FILES && pageUrls.size < MAX_URL_RESULTS) {
    const sitemapUrl = sitemapQueue.shift()!
    if (visitedSitemaps.has(sitemapUrl)) continue
    visitedSitemaps.add(sitemapUrl)

    const xml = await fetchTextIfOk(sitemapUrl)
    if (!xml) continue

    const entries = extractLocEntries(xml)
    if (entries.length === 0) continue

    for (const entry of entries) {
      const normalized = normalizeInternalUrl(entry, baseUrl, sitemapUrl)
      if (!normalized) continue

      if (isLikelySitemapFile(normalized)) {
        if (!visitedSitemaps.has(normalized) && sitemapQueue.length < MAX_SITEMAP_FILES) {
          sitemapQueue.push(normalized)
        }
        continue
      }

      pageUrls.add(normalized)
      if (pageUrls.size >= MAX_URL_RESULTS) break
    }
  }

  return {
    urls: Array.from(pageUrls),
    visitedSitemaps: Array.from(visitedSitemaps),
  }
}

async function crawlInternalLinks(baseUrl: URL) {
  const root = baseUrl.toString()
  const queue: string[] = [root]
  const visited = new Set<string>()
  const discovered = new Set<string>([root])

  while (queue.length > 0 && visited.size < MAX_LINK_CRAWL_PAGES && discovered.size < MAX_URL_RESULTS) {
    const currentUrl = queue.shift()!
    if (visited.has(currentUrl)) continue
    visited.add(currentUrl)

    const html = await fetchTextIfOk(currentUrl)
    if (!html) continue

    const hrefs = extractHrefEntries(html)
    for (const href of hrefs) {
      if (!href || href.startsWith('#')) continue
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue

      const normalized = normalizeInternalUrl(href, baseUrl, currentUrl)
      if (!normalized) continue

      if (!discovered.has(normalized)) {
        discovered.add(normalized)
        if (!visited.has(normalized) && queue.length < MAX_LINK_CRAWL_PAGES * 2) {
          queue.push(normalized)
        }
      }

      if (discovered.size >= MAX_URL_RESULTS) break
    }
  }

  return Array.from(discovered)
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
      new URL('/sitemap-index.xml', baseUrl).toString(),
      new URL('/sitemap_index.xml', baseUrl).toString(),
      new URL('/wp-sitemap.xml', baseUrl).toString(),
    ]

    const robotsText = await fetchTextIfOk(new URL('/robots.txt', baseUrl).toString())
    const robotDeclared = robotsText ? extractSitemapsFromRobots(robotsText, baseUrl) : []

    const allCandidates = Array.from(new Set([...candidateSitemaps, ...robotDeclared]))

    const sitemapResult = await collectUrlsFromSitemaps(allCandidates, baseUrl)
    const sitemapUrls = sitemapResult.urls
    let deduped = sitemapUrls.length > 0 ? sitemapUrls : []
    let usedFallbackCrawl = false

    if (deduped.length <= 1) {
      const internalCrawlUrls = await crawlInternalLinks(baseUrl)
      if (internalCrawlUrls.length > deduped.length) {
        deduped = internalCrawlUrls
        usedFallbackCrawl = true
      }
    }

    deduped = filterToUserFacingPages(deduped, baseUrl)

    if (deduped.length === 0) {
      deduped = [baseUrl.toString()]
    }

    deduped = deduped.slice(0, MAX_URL_RESULTS)

    return NextResponse.json({
      baseUrl: baseUrl.toString(),
      sitemapUrl: sitemapResult.visitedSitemaps[0] || allCandidates[0],
      sitemapCount: sitemapResult.visitedSitemaps.length,
      usedFallbackCrawl,
      count: deduped.length,
      urls: deduped,
      warning: deduped.length === 1 && deduped[0] === baseUrl.toString()
        ? 'Could not discover additional pages. If your site uses JS-only navigation, add a full sitemap.xml.'
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to crawl sitemap' }, { status: 500 })
  }
}
