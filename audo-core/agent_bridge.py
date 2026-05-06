from fastapi import FastAPI, HTTPException
from browser_use import Agent, Browser, BrowserProfile, ChatGoogle, ChatOpenAI
import os
from pathlib import Path
import requests
import inspect
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from collections import deque

app = FastAPI()


def _load_local_env_files() -> None:
    project_root = Path(__file__).resolve().parents[1]
    for name in (".env", ".env.local"):
        env_file = project_root / name
        if not env_file.exists():
            continue

        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_local_env_files()


def _derive_audit_status(result_text: str, errors: list[str]) -> str:
    has_result = bool((result_text or "").strip())
    has_errors = len(errors) > 0

    if has_result:
        return "Completed"
    if has_errors:
        return "Error Occurred"
    return "In Progress"


def _looks_like_provider_404(text: str) -> bool:
    normalized = (text or "").lower()
    return "404 not found" in normalized and "nginx" in normalized


def _looks_like_agent_output_schema_error(text: str) -> bool:
    normalized = (text or "").lower()
    return (
        "validation error for agentoutput" in normalized
        or "invalid json" in normalized
        or "extra_forbidden" in normalized
    )


def _build_llm(provider: str, api_key: str, model: str):
    if provider == "google":
        return ChatGoogle(model=model, api_key=api_key)

    if provider == "openai":
        base_url = os.getenv("AGENT_OPENAI_BASE_URL")
        kwargs = {"model": model, "api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        return ChatOpenAI(**kwargs)

    raise ValueError(f"Unsupported AGENT_LLM_PROVIDER: {provider}")


def _normalize_errors(raw_errors: list | None) -> list[str]:
    normalized: list[str] = []
    for err in raw_errors or []:
        if err is None:
            continue
        text = str(err).strip()
        if text:
            normalized.append(text)
    return normalized


def _build_homepage_audit_task(url: str) -> str:
    return (
        f"Run a ruthless site audit starting at {url}. "
        "Crawl key internal pages only (homepage + up to 5 important internal pages from nav/footer). "
        "Do not open external links or auth-gated flows. "
        "On each page, scroll enough to inspect above-the-fold and critical lower sections."
        "\n\n"
        "Audit dimensions:\n"
        "- SEO (titles, headings, metadata, internal links, crawlability signals)\n"
        "- Performance (heavy assets, render delays, responsiveness clues)\n"
        "- Accessibility (semantics, alt/labels, focus, contrast risks)\n"
        "- Compliance (privacy/terms/cookie clarity, trust/legal discoverability)\n"
        "- Conversion UX (clarity, CTA friction, hierarchy, credibility)\n"
        "\n"
        "Efficiency constraints:\n"
        "- No more than 10 high-impact issues\n"
        "- Prioritize systemic issues over minor stylistic nits\n"
        "- Prefer concise evidence from visible sections\n"
        "\n"
        "When finished, call done with plain text only (no JSON, no markdown code fences) using:\n"
        "Summary:\n"
        "Top Issues:\n"
        "1) [High|Medium|Low] Area - Evidence - Why it matters - Fix\n"
        "2) ...\n"
        "Quick Wins:\n"
        "- ...\n"
        "Verdict: Completed or Error Occurred\n"
        "\n"
        "If blocked, still provide partial findings and set Verdict: Error Occurred."
    )


def _build_quick_homepage_audit_task(url: str) -> str:
    return (
        f"Run a rapid ruthless site audit starting at {url}. "
        "Check homepage plus up to 2 important internal pages from the main nav/footer. "
        "Do not open external links. Finish fast.\n\n"
        "Return plain text only (no JSON, no markdown code fences) with:\n"
        "Summary:\n"
        "Top Issues:\n"
        "1) [High|Medium|Low] [SEO|Performance|Accessibility|Compliance|UX] Area - Evidence - Fix\n"
        "2) ...\n"
        "Quick Wins:\n"
        "- ...\n"
        "Verdict: Completed or Error Occurred"
    )


def _get_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    normalized = raw.strip().lower()
    return normalized in {"1", "true", "yes", "on"}


def _format_static_audit_report(summary: str, issues: list[dict], quick_wins: list[str], verdict: str) -> str:
    lines: list[str] = [
        "Summary:",
        summary,
        "",
        "Top Issues:",
    ]

    if issues:
        for idx, issue in enumerate(issues, start=1):
            lines.append(
                f"{idx}) [{issue['severity']}] {issue['area']} - {issue['evidence']} - {issue['impact']} - {issue['fix']}"
            )
    else:
        lines.append("1) [Low] General - No high-confidence structural issues detected from static HTML - Limited evidence - Run a visual/manual pass.")

    lines.append("")
    lines.append("Quick Wins:")
    if quick_wins:
        for win in quick_wins:
            lines.append(f"- {win}")
    else:
        lines.append("- Add a short hero-value statement and one clear primary CTA above the fold.")

    lines.append("")
    lines.append(f"Verdict: {verdict}")
    return "\n".join(lines)


def _is_same_site_url(base_host: str, candidate_url: str) -> bool:
    try:
        host = urlparse(candidate_url).hostname or ""
    except Exception:
        return False
    if not host:
        return False
    return host == base_host or host.endswith(f".{base_host}")


def _crawl_internal_pages(start_url: str, headers: dict[str, str], max_pages: int = 6) -> tuple[list[dict], list[str]]:
    normalized_start = start_url if start_url.startswith("http") else f"https://{start_url}"
    parsed_start = urlparse(normalized_start)
    base_host = parsed_start.hostname or ""
    if not base_host:
        return [], [f"Could not determine hostname from {start_url}"]

    visited: set[str] = set()
    queue: deque[str] = deque([normalized_start])
    pages: list[dict] = []
    crawl_errors: list[str] = []

    while queue and len(pages) < max_pages:
        current = queue.popleft()
        canonical = current.rstrip("/")
        if canonical in visited:
            continue
        visited.add(canonical)

        try:
            response = requests.get(current, headers=headers, timeout=15)
            response.raise_for_status()
        except requests.RequestException as exc:
            crawl_errors.append(f"{current}: {exc}")
            continue

        html = response.text or ""
        soup = BeautifulSoup(html, "html.parser")
        pages.append(
            {
                "url": current,
                "response": response,
                "soup": soup,
                "html": html,
            }
        )

        for anchor in soup.find_all("a", href=True):
            href = str(anchor.get("href") or "").strip()
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            absolute = urljoin(current, href)
            parsed = urlparse(absolute)
            if parsed.scheme not in {"http", "https"}:
                continue
            cleaned = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
            if not _is_same_site_url(base_host, cleaned):
                continue
            if cleaned in visited:
                continue
            if len(queue) + len(pages) >= max_pages * 3:
                continue
            queue.append(cleaned)

    return pages, crawl_errors


def _run_static_homepage_audit(url: str) -> dict:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; FirstCheckAuditBot/1.0; +https://useaudo.com)",
    }

    pages, crawl_errors = _crawl_internal_pages(url, headers=headers, max_pages=8)
    if not pages:
        reason = crawl_errors[0] if crawl_errors else "No pages could be fetched."
        report = _format_static_audit_report(
            summary="Could not fetch enough pages for analysis.",
            issues=[
                {
                    "severity": "High",
                    "area": "Availability",
                    "evidence": reason,
                    "impact": "The audit cannot evaluate site quality when pages are unreachable.",
                    "fix": "Ensure primary pages return HTTP 200 and are publicly reachable.",
                }
            ],
            quick_wins=["Verify DNS/hosting status and retry once the site is reachable."],
            verdict="Error Occurred",
        )
        return {
            "status": "Error Occurred",
            "log": report,
            "errors": crawl_errors,
            "model": "static-site-audit",
        }

    issues: list[dict] = []
    quick_wins: list[str] = []

    total_images = 0
    total_missing_alt = 0
    total_inputs = 0
    unlabeled_inputs = 0
    short_titles = 0
    missing_meta = 0
    slow_pages = 0
    heavy_html_pages = 0
    found_privacy = False
    found_terms = False
    found_cookie = False

    for page in pages:
        page_url = str(page["url"])
        soup = page["soup"]
        response = page["response"]
        html = str(page["html"])

        page_title = (soup.title.string.strip() if soup.title and soup.title.string else "")
        if not page_title or len(page_title) < 20:
            short_titles += 1

        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_desc = (meta_desc_tag.get("content", "").strip() if meta_desc_tag else "")
        if not meta_desc or len(meta_desc) < 80:
            missing_meta += 1

        h1_tags = soup.find_all("h1")
        if len(h1_tags) == 0:
            issues.append({
                "severity": "High",
                "area": "SEO",
                "evidence": f"No H1 found on {page_url}",
                "impact": "Weak topical clarity for both users and crawlers.",
                "fix": "Add one descriptive H1 on each key page.",
            })

        images = soup.find_all("img")
        total_images += len(images)
        total_missing_alt += len([img for img in images if not str(img.get("alt", "")).strip()])

        if not soup.find("html", attrs={"lang": True}):
            issues.append({
                "severity": "Medium",
                "area": "Accessibility",
                "evidence": f"Missing html lang attribute on {page_url}",
                "impact": "Screen readers may use incorrect pronunciation rules.",
                "fix": "Set <html lang=\"en\"> (or correct locale) on all pages.",
            })

        inputs = soup.find_all(["input", "textarea", "select"])
        page_unlabeled = 0
        for field in inputs:
            input_id = str(field.get("id", "")).strip()
            has_label = bool(input_id and soup.find("label", attrs={"for": input_id}))
            has_aria = bool(str(field.get("aria-label", "")).strip() or str(field.get("aria-labelledby", "")).strip())
            if not has_label and not has_aria:
                page_unlabeled += 1
        total_inputs += len(inputs)
        unlabeled_inputs += page_unlabeled

        if response.elapsed.total_seconds() > 2.8:
            slow_pages += 1
        if len(html) > 500_000:
            heavy_html_pages += 1

        text_blob = soup.get_text(" ", strip=True).lower()
        if "privacy" in text_blob:
            found_privacy = True
        if "terms" in text_blob or "terms of service" in text_blob:
            found_terms = True
        if "cookie" in text_blob:
            found_cookie = True

    if short_titles > 0:
        issues.append({
            "severity": "Medium",
            "area": "SEO",
            "evidence": f"{short_titles} page(s) have missing/short <title> tags.",
            "impact": "Lower relevance and CTR from search results.",
            "fix": "Use specific title tags including intent + key value proposition.",
        })

    if missing_meta > 0:
        issues.append({
            "severity": "Medium",
            "area": "SEO",
            "evidence": f"{missing_meta} page(s) have missing/weak meta descriptions.",
            "impact": "Reduced snippet quality and weaker click-through rates.",
            "fix": "Write 120-160 character meta descriptions with clear user value.",
        })

    if total_images > 0 and total_missing_alt > 0:
        issues.append({
            "severity": "Medium",
            "area": "Accessibility",
            "evidence": f"{total_missing_alt}/{total_images} images are missing alt text.",
            "impact": "Non-visual users lose context and meaning.",
            "fix": "Add meaningful alt text to informative images and empty alt to decorative ones.",
        })

    if total_inputs > 0 and unlabeled_inputs > 0:
        issues.append({
            "severity": "High",
            "area": "Accessibility",
            "evidence": f"{unlabeled_inputs}/{total_inputs} form fields are unlabeled.",
            "impact": "Form completion and accessibility compliance degrade significantly.",
            "fix": "Associate labels via for/id or add aria-label/aria-labelledby.",
        })

    if slow_pages > 0 or heavy_html_pages > 0:
        issues.append({
            "severity": "Medium",
            "area": "Performance",
            "evidence": f"{slow_pages} slow response page(s), {heavy_html_pages} heavy HTML page(s).",
            "impact": "Perceived speed and conversion can drop, especially on mobile.",
            "fix": "Optimize server response, compress payloads, and trim non-critical markup.",
        })

    if not found_privacy or not found_terms:
        issues.append({
            "severity": "High",
            "area": "Compliance",
            "evidence": "Privacy policy or terms references are not clearly discoverable across crawled pages.",
            "impact": "Legal/compliance trust posture may be weak for users and regulators.",
            "fix": "Add clear Privacy and Terms links in global footer/navigation.",
        })

    if not found_cookie:
        issues.append({
            "severity": "Low",
            "area": "Compliance",
            "evidence": "No cookie-related disclosure detected in crawled content.",
            "impact": "May create consent/compliance risk depending on tracking stack and region.",
            "fix": "Add transparent cookie disclosure and consent controls where required.",
        })

    quick_wins.extend([
        "Create unique title/meta pairs for top traffic pages.",
        "Fix missing alt text and unlabeled form fields first for immediate accessibility lift.",
        "Expose Privacy/Terms/Cookie controls in the footer on every page.",
        "Reduce heavy HTML/asset payloads on the slowest pages.",
    ])

    summary = (
        f"Static site scan completed for {url} across {len(pages)} internal page(s); "
        f"identified {len(issues)} issue(s) across SEO, Performance, Accessibility, Compliance, and UX."
    )
    verdict = "Completed"
    report = _format_static_audit_report(summary, issues[:10], quick_wins[:5], verdict)
    return {
        "status": verdict,
        "log": report,
        "errors": crawl_errors,
        "model": "static-site-audit",
    }


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Agent bridge is running.",
        "docs": "/docs",
        "endpoint": "POST /run-audit?url=https://example.com",
    }

def _build_browser() -> Browser:
    # Create a fresh browser per audit request to avoid stale CDP sessions.
    return Browser(
        browser_profile=BrowserProfile(
            headless=False,
            window_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720},
            enable_default_extensions=False,
            wait_between_actions=0.05,
            wait_for_network_idle_page_load_time=0.25,
        )
    )


async def _close_browser_safely(browser: Browser) -> None:
    close_fn = getattr(browser, "close", None)
    if not close_fn:
        return

    result = close_fn()
    if inspect.isawaitable(result):
        await result

@app.post("/run-audit")
async def run_audit(url: str):
    try:
        llm_provider = os.getenv("AGENT_LLM_PROVIDER", "google").strip().lower()
        if llm_provider == "google":
            agent_api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            missing_key_message = "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable"
            primary_model = os.getenv("AGENT_MODEL", "gemini-2.5-flash")
            fallback_model = os.getenv("AGENT_FALLBACK_MODEL", "gemini-2.5-flash-lite")
        elif llm_provider == "openai":
            agent_api_key = os.getenv("OPENAI_API_KEY")
            missing_key_message = "Missing OPENAI_API_KEY environment variable"
            primary_model = os.getenv("AGENT_MODEL", "gpt-4.1-mini")
            fallback_model = os.getenv("AGENT_FALLBACK_MODEL", "")
        else:
            raise HTTPException(status_code=500, detail=f"Unsupported AGENT_LLM_PROVIDER: {llm_provider}")

        if not agent_api_key:
            raise HTTPException(status_code=500, detail=missing_key_message)

        llm_timeout_seconds = int(os.getenv("AGENT_LLM_TIMEOUT_SECONDS", "150"))
        llm_screenshot_width = int(os.getenv("AGENT_SCREENSHOT_WIDTH", "896"))
        llm_screenshot_height = int(os.getenv("AGENT_SCREENSHOT_HEIGHT", "504"))
        max_steps = int(os.getenv("AGENT_MAX_STEPS", "16"))
        attempt_timeout_seconds = int(os.getenv("AGENT_ATTEMPT_TIMEOUT_SECONDS", "100"))
        use_vision = _get_bool_env("AGENT_USE_VISION", True)
        runtime_errors: list[str] = []

        async def _run_attempt(model: str, task: str, attempt_use_vision: bool | None = None, attempt_max_steps: int | None = None) -> object:
            attempt_browser = _build_browser()
            llm = _build_llm(provider=llm_provider, api_key=agent_api_key, model=model)
            agent = Agent(
                task=task,
                llm=llm,
                browser=attempt_browser,
                use_vision=use_vision if attempt_use_vision is None else attempt_use_vision,
                llm_screenshot_size=(llm_screenshot_width, llm_screenshot_height),
                llm_timeout=llm_timeout_seconds,
            )
            try:
                return await asyncio.wait_for(
                    agent.run(max_steps=max_steps if attempt_max_steps is None else attempt_max_steps),
                    timeout=attempt_timeout_seconds,
                )
            except asyncio.TimeoutError as exc:
                raise RuntimeError(f"Agent attempt timed out after {attempt_timeout_seconds}s") from exc
            finally:
                await _close_browser_safely(attempt_browser)

        async def _try_run(model: str, task: str, attempt_use_vision: bool | None = None, attempt_max_steps: int | None = None):
            try:
                return await _run_attempt(model, task, attempt_use_vision, attempt_max_steps)
            except Exception as exc:
                runtime_errors.append(str(exc))
                return None

        model_used = primary_model
        history = await _try_run(primary_model, _build_homepage_audit_task(url))

        error_messages = _normalize_errors(history.errors()) if history else []
        cdp_init_error = any("cdp client not initialized" in msg.lower() for msg in error_messages)
        if cdp_init_error:
            history = await _try_run(primary_model, _build_homepage_audit_task(url))
            error_messages = _normalize_errors(history.errors()) if history else []

        schema_error = _looks_like_agent_output_schema_error("\n".join(error_messages))
        if schema_error and fallback_model and fallback_model != primary_model:
            history = await _try_run(fallback_model, _build_homepage_audit_task(url))
            model_used = fallback_model
            error_messages = _normalize_errors(history.errors()) if history else []

        schema_error_again = _looks_like_agent_output_schema_error("\n".join(error_messages))
        if schema_error_again:
            history = await _try_run(model_used, _build_quick_homepage_audit_task(url), attempt_use_vision=False, attempt_max_steps=10)
            error_messages = _normalize_errors(history.errors()) if history else []

        combined_error_text = "\n".join(error_messages + [history.final_result() or ""] if history else error_messages)
        if (
            _looks_like_provider_404(combined_error_text)
            and fallback_model
            and fallback_model != primary_model
        ):
            history = await _try_run(fallback_model, _build_homepage_audit_task(url))
            model_used = fallback_model

        final_result = history.final_result() or "" if history else ""
        errors = (_normalize_errors(history.errors()) if history else []) + runtime_errors
        status = _derive_audit_status(final_result, errors)

        if status == "Error Occurred" or not final_result.strip():
            static_fallback = _run_static_homepage_audit(url)
            final_result = str(static_fallback.get("log", final_result))
            status = str(static_fallback.get("status", status))
            errors = errors + [
                "Primary browser agent flow failed; returned static site audit fallback."
            ]
            model_used = str(static_fallback.get("model", model_used))

        return {
            "status": status,
            "log": final_result,
            "errors": errors,
            "model": model_used,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"run_audit failed: {exc}") from exc

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
