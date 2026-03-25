"use client";

import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';

const caseStudies = [
  {
    id: 1,
    site: "WLink",
    url: "wlink-new.geektechsol.com",
    industry: "SaaS / WhatsApp API & Workflow Automation",
    role: "Founder",
    focus: ["Performance", "Accessibility", "SEO"],
    scores: { performance: 71, accessibility: 91, seo: 100 },
    headline: "A technically capable SaaS with a performance bottleneck hiding in plain sight.",
    summary: "WLink is a WhatsApp API platform built for businesses running bots, workflows, and automated messaging. The site itself was clean and functional — but Lighthouse told a different story under the hood.",
    keyFindings: [
      {
        category: "Performance",
        issue: "140 KB of unused JavaScript on every load",
        detail: "The main JS bundle was 259 KB but nearly half wasn't needed on the initial page. With code splitting, that's an easy win that would meaningfully improve load time."
      },
      {
        category: "Performance",
        issue: "Logo image 6x larger than displayed",
        detail: "The WLink logo file was 600x200px but rendered at 96x32px — loading 56 KB more than needed on every visit. Converting to WebP and resizing to display dimensions alone saves 56 KB."
      },
      {
        category: "Performance",
        issue: "CSS and Cloudflare script blocking render for 920ms",
        detail: "Two render-blocking resources were delaying the page from displaying anything for nearly a full second. Adding defer to script tags and inlining critical CSS removes this bottleneck."
      },
      {
        category: "Accessibility",
        issue: "Mobile menu button has no accessible name",
        detail: "Screen readers announced the hamburger menu as just 'button' with no context. A simple aria-label='Open menu' fixes this completely."
      },
    ],
    quote: "The information is genuinely useful. Even as someone who already had an idea of the issues, the audit added good notes for improvement.",
    rating: 4,
    tag: "Beta Audit #1",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: 2,
    site: "RadonFinder",
    url: "radonfinder.ca",
    industry: "Directory / B2C",
    role: "Owner & Founder",
    focus: ["SEO", "Performance"],
    scores: { performance: 94, accessibility: 88, seo: 100 },
    headline: "A well-built directory site with one invisible issue that could tank its Google ranking.",
    summary: "RadonFinder is a Canadian radon testing and mitigation directory — a niche but important product. The site was already in solid shape with a 94 performance score. But one issue in the audit stood out as urgent.",
    keyFindings: [
      {
        category: "SEO",
        issue: "Google Tag Manager loading 154 KB of unused script",
        detail: "GTM was the single biggest drag on performance — responsible for several long main-thread tasks and 63 KB of unused JavaScript. Auditing GTM tags and loading it async would meaningfully improve speed."
      },
      {
        category: "Performance",
        issue: "Hero image compression too low (~34 KB savings)",
        detail: "The hero background was already WebP — a great choice — but the compression setting was too generous. Re-exporting at quality 60-70 saves 34 KB with no visible difference."
      },
      {
        category: "Accessibility",
        issue: "Low contrast text on feature cards",
        detail: "The grey body text in feature cards didn't meet WCAG minimum contrast ratios. A small colour adjustment fixes this and improves readability for all users."
      },
      {
        category: "Accessibility",
        issue: "Heading order skips levels",
        detail: "Headings jumped from H1 to H3 in places, which confuses screen readers. Fixing the hierarchy to flow H1 → H2 → H3 without gaps is a quick structural fix."
      },
    ],
    quote: "Very good — found a couple of performance things I can optimize. Helpful in understanding what to prioritize.",
    rating: 4,
    tag: "Beta Audit #2",
    tagColor: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: 3,
    site: "Bornday",
    url: "bornday.app",
    industry: "Consumer App / Birthday Deals",
    role: "Founder",
    focus: ["UI/UX", "Performance", "SEO"],
    scores: { performance: 95, accessibility: 82, seo: 91 },
    headline: "Beautiful design, strong scores — but the homepage was invisible to Google's crawler.",
    summary: "Bornday is a consumer app for discovering birthday deals, discounts and freebies. The dashboard was technically excellent. But the homepage — the page that matters most for first impressions and SEO — was throwing errors that Lighthouse couldn't even load.",
    keyFindings: [
      {
        category: "Critical",
        issue: "Homepage failed to load in Lighthouse — twice",
        detail: "The homepage triggered a NO_FCP error on every test run, meaning Google's crawler is likely having the same difficulty. If Google can't render your page, it can't index it. This is the most urgent issue on the site."
      },
      {
        category: "SEO",
        issue: "robots.txt has 27 errors",
        detail: "The robots.txt file — which tells Google what to crawl — had 27 errors that could be actively blocking parts of the site from being indexed. Running it through Google Search Console reveals every error."
      },
      {
        category: "UI/UX",
        issue: "Value proposition unclear in the first 5 seconds",
        detail: "'Your next birthday just got better' is fun but doesn't explain what the product does. The subheading helps but is too small. The hook — finding birthday deals — should be front and centre."
      },
      {
        category: "UI/UX",
        issue: "Asking for signup before showing any value",
        detail: "The entire homepage is a login screen with no preview of what's inside. For a consumer app, this is a conversion killer. Even a few sample deals would give visitors a reason to hand over their Google account."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #3",
    tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: 4,
    site: "DevLand",
    url: "devland.chatyshop.com",
    industry: "Developer Tools / Offline DevOps",
    role: "Founder",
    focus: ["Performance", "SEO", "UI/UX"],
    scores: { performance: 95, accessibility: 82, seo: 92 },
    headline: "A powerful DevOps tool undermined by a branding identity crisis.",
    summary: "DevLand is an offline-first desktop workstation for infrastructure operations — SSH, SFTP, deployments, log monitoring and API testing in one place. The technical scores were strong. But the site had a problem that no Lighthouse score would ever catch.",
    keyFindings: [
      {
        category: "Critical",
        issue: "Three different product names on the same site",
        detail: "The site used DevLand, ChatyDevOps, and ChatyShop interchangeably across pages. For a developer audience, this immediately destroys trust — they won't know what they're downloading or who they're buying from."
      },
      {
        category: "Performance",
        issue: "Pricing page appeared completely empty on load",
        detail: "The pricing cards loaded dynamically after two dropdowns rendered. On slow connections the page looked broken. A loading skeleton or server-side rendered default would prevent this drop-off."
      },
      {
        category: "SEO",
        issue: "robots.txt has 31 errors",
        detail: "Same pattern as other sites in this beta — a malformed robots.txt that could be actively preventing Google from indexing the site correctly."
      },
      {
        category: "UI/UX",
        issue: "No product screenshots anywhere on the site",
        detail: "The site was entirely text on white with no visuals of the actual desktop app. For a DevOps tool, showing the interface is the strongest selling point. Developers want to see what they're downloading."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #4",
    tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    id: 5,
    site: "AI Agent Flow",
    url: "aiagentflow.dev",
    industry: "Developer Tools / AI Engineering",
    role: "Founder",
    focus: ["Performance", "Accessibility", "SEO"],
    scores: { performance: 95, accessibility: 88, seo: 100 },
    headline: "One of the best developer landing pages in the beta — with one positioning opportunity.",
    summary: "AI Agent Flow is an open-source CLI that runs a full AI development team locally — Architect, Coder, Reviewer, Tester, Fixer and Judge — using your own API keys with no cloud dependency. The landing page was genuinely excellent. The terminal demo, the install command in the navbar, the dark theme — all exactly right for a developer audience.",
    keyFindings: [
      {
        category: "Performance",
        issue: "86 KB of unused JavaScript on initial load",
        detail: "Dynamic imports for anything not needed above the fold would reduce this. For a Next.js app this is straightforward with React.lazy or next/dynamic."
      },
      {
        category: "Accessibility",
        issue: "Dark mode toggle and GitHub icon have no accessible name",
        detail: "Icon-only buttons without aria-labels are announced as just 'button' by screen readers. Two lines of code — aria-label='Toggle dark mode' and aria-label='View on GitHub' — fixes both."
      },
      {
        category: "Positioning",
        issue: "'Autonomous AI Engineering Team' is a crowded claim",
        detail: "The real differentiator — local-first, uses your own API keys, no cloud — is buried in the subheading. For developers who are privacy-conscious or API cost-sensitive, that's the hook that beats Devin and Copilot."
      },
      {
        category: "SEO",
        issue: "Perfect score — nothing to fix",
        detail: "100/100 SEO. Title, meta description, canonical, hreflang, robots.txt, crawlability — all passing. This is rare and worth preserving as the project grows."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #5",
    tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    id: 6,
    site: "WinWorthy",
    url: "winworthy.io",
    industry: "B2B SaaS / Proposal & RFP Intelligence",
    role: "Founder",
    focus: ["Accessibility", "SEO"],
    scores: { performance: 97, accessibility: 91, seo: 100 },
    headline: "The strongest landing page in the beta — with a silent JavaScript error firing on every visit.",
    summary: "WinWorthy is a Go/No-Go decision tool for the proposal and RFP industry. It scores every opportunity across 16 criteria and gives teams a clear, defensible recommendation in minutes. The site was technically excellent and visually polished. But opening the browser console revealed something the founder didn't know about.",
    keyFindings: [
      {
        category: "Critical",
        issue: "React hydration error firing on every page load",
        detail: "A React error #418 and a null reference error were firing silently in the console on every visit. These suggest a server/client rendering mismatch that can cause subtle UI bugs for some users — worth fixing before scaling traffic."
      },
      {
        category: "Accessibility",
        issue: "Low contrast text on feature cards",
        detail: "The grey body text in the dark feature cards was close to passing but didn't quite meet the 4.5:1 WCAG ratio. A small lightness adjustment fixes it and makes the text more readable for everyone."
      },
      {
        category: "Accessibility",
        issue: "Missing main landmark element",
        detail: "The page lacked a <main> HTML element wrapping the primary content. This is a quick structural fix that helps screen readers navigate directly to the main content."
      },
      {
        category: "SEO",
        issue: "Keyword opportunity in a niche market",
        detail: "Perfect technical SEO score — but terms like 'RFP go no-go decision', 'proposal qualification tool', and 'bid no bid framework' should be woven into the page copy. These are what buyers actually search for."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #6",
    tagColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  {
    id: 7,
    site: "srisan.ai",
    url: "srisan.ai",
    industry: "AI / SaaS",
    role: "Founder",
    focus: ["Performance", "Accessibility", "SEO"],
    scores: { performance: 76, accessibility: 93, seo: 100 },
    headline: "Perfect SEO and a fast server — held back by one fixable image problem.",
    summary: "srisan.ai came in with excellent foundations — a perfect SEO score, solid accessibility, and a server response time that most sites would envy. The entire performance issue traced back to a single cause: unoptimized images adding nearly 2 MB of weight to every page load.",
    keyFindings: [
      {
        category: "Performance",
        issue: "Images adding nearly 2 MB of unnecessary weight",
        detail: "The Largest Contentful Paint was 7.9 seconds despite everything else being fast. Compressing images and converting to WebP or AVIF format alone could push the performance score from 76 into the 90s."
      },
      {
        category: "Performance",
        issue: "Render blocking resources causing small delay",
        detail: "A small render-blocking resource was slightly delaying page display. Adding defer or async to non-critical script tags removes this from the critical path."
      },
      {
        category: "Accessibility",
        issue: "Low contrast text on some elements",
        detail: "Some text did not meet the 4.5:1 minimum contrast ratio. A small colour adjustment using WebAIM's contrast checker resolves this quickly."
      },
      {
        category: "Accessibility",
        issue: "Missing main landmark and identical links",
        detail: "The page lacked a main HTML element wrapping primary content, and had links pointing to the same destination with inconsistent labels. Both are quick structural fixes."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #7",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: 8,
    site: "builders.to",
    url: "builders.to",
    industry: "Community Platform / Developer Tools",
    role: "Founder",
    focus: ["Performance", "Accessibility", "SEO"],
    scores: { performance: 58, accessibility: 73, seo: 92 },
    headline: "A promising community platform with foundational issues worth fixing before pushing traffic.",
    summary: "builders.to is a Reddit-style community platform for developers and builders. The founder came in with exactly the right mindset — wanting to make sure the foundation was solid before driving traffic. The audit found real issues across all three categories, but none requiring a redesign.",
    keyFindings: [
      {
        category: "Performance",
        issue: "Layout shifting as content loads (CLS: 0.101)",
        detail: "On a feed-style site, dynamic content loading causes elements to jump around on screen. Google penalizes this heavily. Adding skeleton loading placeholders while content fetches fixes it and improves perceived performance."
      },
      {
        category: "Accessibility",
        issue: "Zoom disabled on mobile — a hard WCAG failure",
        detail: "The viewport meta tag had user-scalable=no which prevents users with low vision from zooming in. Removing this one attribute is the fastest single fix on the entire site."
      },
      {
        category: "Accessibility",
        issue: "Buttons and links missing accessible names",
        detail: "Several icon-only buttons and links had no aria-label, meaning screen readers announced them as just 'button' or 'link' with no context. Common on feed-style sites with upvote and share buttons."
      },
      {
        category: "SEO",
        issue: "11 links with no descriptive text",
        detail: "Links without descriptive text tell Google nothing about their destination. On a community feed this is often post thumbnail links or icon buttons — adding aria-labels fixes both the SEO and accessibility issue simultaneously."
      },
    ],
    quote: null,
    rating: null,
    tag: "Beta Audit #8",
    tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
];

function ScorePill({ label, score }: { label: string; score: number | null }) {
  if (score === null) return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xl font-black text-gray-600">N/A</div>
      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );

  const color = score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const bg = score >= 90 ? 'bg-green-400/5' : score >= 50 ? 'bg-yellow-400/5' : 'bg-red-400/5';

  return (
    <div className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl ${bg}`}>
      <div className={`text-2xl font-black ${color}`}>{score}</div>
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    Performance: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Accessibility: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    SEO: 'bg-green-500/10 text-green-400 border-green-500/20',
    'UI/UX': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    Positioning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Conversion: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Credibility: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[category] || 'bg-white/5 text-gray-400 border-white/10'}`}>
      {category}
    </span>
  );
}

export default function CaseStudies() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-24 space-y-32">

        {/* Header */}
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="space-y-4">
            <span className="px-4 py-1.5 text-[10px] font-black border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full inline-flex items-center gap-2 uppercase tracking-[0.2em]">
              Beta Results
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent leading-[0.95] py-2">
              8 real sites.<br />8 real audits.
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
              These are the actual sites audited during the First Check beta — real founders, real scores, real findings. No cherry-picking, no fake data.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-8 pt-4 border-t border-white/5">
            {[
              { value: "8", label: "Sites Audited" },
              { value: "4/5", label: "Avg Rating" },
              { value: "100%", label: "Free Beta" },
              { value: "24hr", label: "Turnaround" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Studies */}
        {caseStudies.map((cs, index) => (
          <article key={cs.id} className="space-y-8">

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cs.tagColor}`}>
                  {cs.tag}
                </span>
                <span className="text-gray-600 text-xs font-medium">{cs.industry}</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{cs.site}</h2>
                  <a
                    href={`https://${cs.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors text-sm"
                  >
                    {cs.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Scores */}
                <div className="flex gap-2 flex-shrink-0">
                  <ScorePill label="Perf" score={cs.scores.performance} />
                  <ScorePill label="A11y" score={cs.scores.accessibility} />
                  <ScorePill label="SEO" score={cs.scores.seo} />
                </div>
              </div>

              <p className="text-blue-400 font-bold text-lg leading-snug max-w-3xl">{cs.headline}</p>
              <p className="text-gray-400 leading-relaxed max-w-3xl">{cs.summary}</p>
            </div>

            {/* Findings */}
            <div className="space-y-3">
              <p className="text-white font-black text-xs uppercase tracking-widest">Key Findings</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cs.keyFindings.map((finding, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-white font-bold text-sm leading-snug">{finding.issue}</p>
                      <CategoryBadge category={finding.category} />
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">{finding.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote */}
            {cs.quote && (
              <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
                <p className="text-gray-300 italic text-sm leading-relaxed">"{cs.quote}"</p>
                <p className="text-gray-600 text-xs mt-2 font-bold">{cs.site} Founder, after receiving audit</p>
              </div>
            )}

            {/* Divider */}
            {index < caseStudies.length - 1 && (
              <div className="border-t border-white/5 pt-8" />
            )}
          </article>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/5 border border-blue-500/20 rounded-3xl p-12 text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Want yours next?</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Every audit above was done manually by a real founder. The $29 Deep-Dive gives you the same treatment — delivered in 24 hours.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-xl"
            >
              Get My Audit — $29
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="text-gray-500 text-sm hover:text-white transition-colors underline underline-offset-2"
            >
              Or try the free score first →
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}