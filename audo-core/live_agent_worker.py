from __future__ import annotations

import asyncio
import base64
import os
import re
import socket
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from pydantic import BaseModel

from browser_use import Agent, Browser, BrowserProfile, ChatGoogle, ChatOpenAI

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


class RunSessionRequest(BaseModel):
    session_id: str
    audit_id: str
    user_id: str
    target_url: str
    job_id: str | None = None


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value


def _supabase_headers() -> dict[str, str]:
    service_key = _required_env("SUPABASE_SERVICE_ROLE_KEY")
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _supabase_rest_url(path: str) -> str:
    base = _required_env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    return f"{base}/rest/v1/{path.lstrip('/')}"


def _patch_session(session_id: str, payload: dict[str, Any]) -> None:
    response = requests.patch(
        _supabase_rest_url(f"agent_sessions?id=eq.{session_id}"),
        headers=_supabase_headers(),
        json=payload,
        timeout=15,
    )
    response.raise_for_status()


def _patch_job(job_id: str | None, payload: dict[str, Any]) -> None:
    if not job_id:
        return

    response = requests.patch(
        _supabase_rest_url(f"agent_jobs?id=eq.{job_id}"),
        headers=_supabase_headers(),
        json=payload,
        timeout=15,
    )
    response.raise_for_status()


def _insert_event(
    *,
    session_id: str,
    audit_id: str,
    user_id: str,
    event_type: str,
    message: str,
    current_url: str | None = None,
    cursor_x: float | None = None,
    cursor_y: float | None = None,
    scroll_y: float | None = None,
    screenshot_url: str | None = None,
    severity: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    payload = {
        "session_id": session_id,
        "audit_id": audit_id,
        "user_id": user_id,
        "event_type": event_type,
        "message": message,
        "current_url": current_url,
        "cursor_x": cursor_x,
        "cursor_y": cursor_y,
        "scroll_y": scroll_y,
        "screenshot_url": screenshot_url,
        "severity": severity,
        "metadata": metadata or {},
    }
    response = requests.post(
        _supabase_rest_url("agent_events"),
        headers=_supabase_headers(),
        json=payload,
        timeout=15,
    )
    response.raise_for_status()


def _build_llm():
    provider = os.getenv("AGENT_LLM_PROVIDER", "google").strip().lower()
    if provider == "google":
        api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("Missing GOOGLE_GENERATIVE_AI_API_KEY")
        return ChatGoogle(model=os.getenv("AGENT_MODEL", "gemini-2.5-flash"), api_key=api_key)

    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing OPENAI_API_KEY")
        kwargs: dict[str, Any] = {"model": os.getenv("AGENT_MODEL", "gpt-4.1-mini"), "api_key": api_key}
        base_url = os.getenv("AGENT_OPENAI_BASE_URL")
        if base_url:
            kwargs["base_url"] = base_url
        return ChatOpenAI(**kwargs)

    raise RuntimeError(f"Unsupported AGENT_LLM_PROVIDER: {provider}")


def _get_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _build_browser() -> Browser:
    return Browser(
        browser_profile=BrowserProfile(
            headless=_get_bool_env("LIVE_AGENT_HEADLESS", True),
            window_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720},
            enable_default_extensions=False,
            wait_between_actions=0.35,
            wait_for_network_idle_page_load_time=0.7,
        )
    )


def _worker_id() -> str:
    return os.getenv("LIVE_AGENT_WORKER_ID") or f"worker-{socket.gethostname()}"


def _live_view_url_for_session(session_id: str) -> str | None:
    template = os.getenv("LIVE_AGENT_LIVE_VIEW_URL_TEMPLATE", "").strip()
    if not template:
        return None
    return template.format(session_id=session_id)


def _claim_next_job() -> dict[str, Any] | None:
    worker_id = _worker_id()
    response = requests.get(
        _supabase_rest_url("agent_jobs?status=eq.queued&order=priority.asc,created_at.asc&limit=1"),
        headers=_supabase_headers(),
        timeout=15,
    )
    response.raise_for_status()
    jobs = response.json()
    if not jobs:
        return None

    job = jobs[0]
    attempts = int(job.get("attempts") or 0) + 1
    claim = requests.patch(
        _supabase_rest_url(f"agent_jobs?id=eq.{job['id']}&status=eq.queued"),
        headers=_supabase_headers(),
        json={
            "status": "claimed",
            "worker_id": worker_id,
            "attempts": attempts,
            "claimed_at": _now_iso(),
        },
        timeout=15,
    )
    claim.raise_for_status()
    claimed_rows = claim.json()
    return claimed_rows[0] if claimed_rows else None


def _normalize_target_url(url: str) -> str:
    trimmed = str(url or "").strip()
    if not trimmed:
        raise ValueError("target_url is required")
    return trimmed if trimmed.startswith(("http://", "https://")) else f"https://{trimmed}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_task(url: str) -> str:
    base_url = url.rstrip("/")
    return (
        f"Act like a senior conversion auditor. Open {url} and visibly inspect it like a human user. "
        "Do not log into anything, submit paid/contact/signup forms, edit files, update todo.md, or open external domains. "
        "Be efficient: inspect the homepage first, then visit the most important internal pages directly instead of repeatedly rescanning the same page. "
        f"Required pages to check if they load: {base_url}/pricing, {base_url}/how-it-works, {base_url}/comparison, and {base_url}/case-studies. "
        "If a required page returns 404 or redirects, note that and move on. "
        "Scroll each important page enough to understand the offer, proof, objections, CTAs, accessibility, SEO, and trust issues. "
        "Interact with safe public UI: open and close modals, click tabs/accordions, and try free score/demo widgets using the audited URL if a URL input is visible. "
        "Never enter personal data, payment data, passwords, or private information. "
        "If scrolling appears stuck or a page does not reveal more content after two attempts, do not stop the run; record that as a finding, then continue to the next required page by direct URL navigation. "
        "Do not spend more than four browser steps on the same URL; if the page state repeats, summarize what you learned and navigate to the next required page. "
        "On case-studies, inspect at most two detailed case studies, then move on; do not loop through every case study card. "
        "Do not click Log in, Sign in, Sign up, Get Started, or dashboard CTAs during this public-site pass. "
        "If you accidentally reach a login, signup, auth, or dashboard page, record that the CTA leads to authentication and immediately navigate to the next required public page. "
        "You are not finished until you have checked the required pages or confirmed they are unavailable. "
        "Prioritize evidence that can become a concrete checklist. Avoid spending more than three steps on any one page. "
        "When finished, call done with concise plain text using exactly these sections: Summary, Top Findings, Quick Wins. "
        "For each Top Finding, use a separate bullet with exactly: Severity, Issue, Evidence, Fix."
    )


def _action_event_type(output: Any) -> str:
    try:
        actions = [action.model_dump() for action in getattr(output, "action", [])]
    except Exception:
        actions = []

    text = str(actions).lower()
    if "click" in text:
        return "click"
    if "scroll" in text:
        return "scroll"
    if "input" in text or "type" in text:
        return "input"
    if "navigate" in text or "url" in text:
        return "navigate"
    return "status"


def _step_message(output: Any, step: int) -> str:
    for attr in ("next_goal", "memory", "evaluation_previous_goal"):
        value = getattr(output, attr, None)
        if value:
            message = str(value).strip()
            lower = message.lower()
            if "todo.md" in lower or lower.startswith("update the todo"):
                return f"Agent completed browser step {step}."
            return message[:500]
    return f"Agent completed browser step {step}."


def _is_auth_url(url: str | None) -> bool:
    lower = str(url or "").lower()
    return any(marker in lower for marker in ("/login", "/log-in", "/signin", "/sign-in", "/signup", "/sign-up", "/auth", "/dashboard"))


def _save_screenshot(session_id: str, step: int, screenshot_b64: str | None) -> str | None:
    if not screenshot_b64:
        return None

    public_dir = Path(__file__).resolve().parents[1] / "public" / "agent-screenshots"
    public_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{session_id}-{step}.jpg"
    path = public_dir / filename

    try:
        path.write_bytes(base64.b64decode(screenshot_b64))
    except Exception:
        return None

    return f"/agent-screenshots/{filename}"


def _save_screenshot_bytes(session_id: str, step: int, screenshot: bytes | None) -> str | None:
    if not screenshot:
        return None

    public_dir = Path(__file__).resolve().parents[1] / "public" / "agent-screenshots"
    public_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{session_id}-{step}.jpg"
    path = public_dir / filename

    try:
        path.write_bytes(screenshot)
    except Exception:
        return None

    return f"/agent-screenshots/{filename}"


def _get_session_status(session_id: str) -> str | None:
    response = requests.get(
        _supabase_rest_url(f"agent_sessions?id=eq.{session_id}&select=status"),
        headers=_supabase_headers(),
        timeout=10,
    )
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return None
    return str(rows[0].get("status") or "")


def _parse_findings(final_result: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    severity_words = {"critical", "high", "medium", "low"}
    normalized = re.sub(r"\s+", " ", final_result or "").strip()

    severity_chunks = re.split(r"(?i)(?=\bseverity\s*[:\-]\s*(?:critical|high|medium|low)\b)", normalized)
    for chunk in severity_chunks:
        text = chunk.strip(" -\t")
        if not text or "severity" not in text.lower():
            continue

        lower = text.lower()
        severity = "medium"
        severity_match = re.search(r"(?i)severity\s*[:\-]\s*(critical|high|medium|low)", text)
        if severity_match:
            severity = severity_match.group(1).lower()
        else:
            for word in severity_words:
                if word in lower:
                    severity = word
                    break

        issue_match = re.search(r"(?i)issue\s*[:\-]\s*(.*?)(?=\s+evidence\s*[:\-]|\s+fix\s*[:\-]|\s+severity\s*[:\-]|$)", text)
        evidence_match = re.search(r"(?i)evidence\s*[:\-]\s*(.*?)(?=\s+fix\s*[:\-]|\s+severity\s*[:\-]|$)", text)
        fix_match = re.search(r"(?i)fix\s*[:\-]\s*(.*?)(?=\s+severity\s*[:\-]|$)", text)

        issue = (issue_match.group(1).strip(" -") if issue_match else text).strip()
        evidence = (evidence_match.group(1).strip(" -") if evidence_match else "").strip()
        fix = (fix_match.group(1).strip(" -") if fix_match else "").strip()
        if not fix:
            fix = "Review this finding from the live agent walkthrough and apply the recommended fix."
        if evidence and evidence.lower() not in issue.lower():
            issue = f"{issue} Evidence: {evidence}"

        findings.append(
            {
                "issue": issue[:280],
                "fix": fix[:500],
                "severity": severity,
            }
        )

    if findings:
        return findings[:8]

    lines = [line.strip(" -\t") for line in final_result.splitlines() if line.strip()]

    for line in lines:
        lower = line.lower()
        if not any(word in lower for word in severity_words):
            continue
        if not (line[:1].isdigit() or lower.startswith(("critical", "high", "medium", "low", "["))):
            continue

        severity = "medium"
        for word in severity_words:
            if word in lower:
                severity = word
                break

        issue = line
        fix = "Review this finding from the live agent walkthrough and apply the recommended fix."
        for marker in (" fix:", " fix -", " recommendation:", " recommendation -"):
            idx = lower.find(marker)
            if idx >= 0:
                issue = line[:idx].strip(" -")
                fix = line[idx + len(marker):].strip(" -") or fix
                break

        findings.append(
            {
                "issue": issue[:280],
                "fix": fix[:500],
                "severity": severity,
            }
        )

    if findings:
        return findings[:8]

    if final_result.strip():
        return [
            {
                "issue": "Live agent could not complete the visible walkthrough.",
                "fix": final_result.strip()[:500],
                "severity": "high" if _result_is_incomplete(final_result) else "medium",
            }
        ]

    return []


def _result_is_incomplete(final_result: str) -> bool:
    lower = final_result.lower()
    incomplete_markers = (
        "not fully compiled",
        "reaching max_steps",
        "reached max_steps",
        "unable to complete the full audit",
        "remaining tasks",
        "was unable to complete",
        "could not complete",
        "could not proceed",
        "did not visibly change",
        "did not change the visible page content",
    )
    return any(marker in lower for marker in incomplete_markers)


def _append_findings_to_audit(audit_id: str, findings: list[dict[str, str]], final_result: str) -> None:
    if not findings:
        return

    response = requests.get(
        _supabase_rest_url(f"audits?id=eq.{audit_id}&select=report_content"),
        headers=_supabase_headers(),
        timeout=15,
    )
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return

    report_content = rows[0].get("report_content") or {}
    checklist = report_content.get("checklist")
    if not isinstance(checklist, list):
        checklist = []

    existing_issues = {str(item.get("issue") or item.get("title") or "").strip().lower() for item in checklist if isinstance(item, dict)}
    live_items = []
    for finding in findings:
        issue_key = finding["issue"].strip().lower()
        if not issue_key or issue_key in existing_issues:
            continue
        live_items.append(
            {
                "title": finding["issue"],
                "issue": finding["issue"],
                "issue_description": finding["issue"],
                "recommendation": finding["fix"],
                "fix": finding["fix"],
                "task": finding["issue"],
                "selector": None,
                "code_example": None,
                "severity": finding["severity"],
                "priority": finding["severity"],
                "category": "ux",
                "source": "live_agent",
                "completed": False,
            }
        )

    if not live_items:
        return

    report_content["checklist"] = checklist + live_items
    report_content["live_agent"] = {
        "summary": final_result[:6000],
        "added_checklist_items": len(live_items),
        "updated_at": _now_iso(),
    }

    patch = {"report_content": report_content}
    update_response = requests.patch(
        _supabase_rest_url(f"audits?id=eq.{audit_id}"),
        headers=_supabase_headers(),
        json=patch,
        timeout=15,
    )
    update_response.raise_for_status()


async def _run_browser_agent(request: RunSessionRequest) -> None:
    target_url = _normalize_target_url(request.target_url)
    browser = _build_browser()
    auth_steps = 0
    worker_id = _worker_id()
    live_view_url = _live_view_url_for_session(request.session_id)

    try:
        _patch_job(
            request.job_id,
            {
                "status": "running",
                "worker_id": worker_id,
                "started_at": _now_iso(),
            },
        )
        _patch_session(
            request.session_id,
            {
                "status": "running",
                "mode": "browser_worker",
                "current_url": target_url,
                "live_view_url": live_view_url,
                "worker_id": worker_id,
                "last_heartbeat_at": _now_iso(),
                "started_at": _now_iso(),
            },
        )
        _insert_event(
            session_id=request.session_id,
            audit_id=request.audit_id,
            user_id=request.user_id,
            event_type="status",
            message="Remote browser worker started.",
            current_url=target_url,
            cursor_x=12,
            cursor_y=14,
            scroll_y=0,
            metadata={"source": "browser-worker", "worker_id": worker_id, "live_view": bool(live_view_url)},
        )
        _insert_event(
            session_id=request.session_id,
            audit_id=request.audit_id,
            user_id=request.user_id,
            event_type="status",
            message="Opening the first public page and waiting for the first live frame.",
            current_url=target_url,
            cursor_x=18,
            cursor_y=18,
            scroll_y=0,
            metadata={"source": "browser-worker", "waiting_for_first_frame": True},
        )

        async def on_step(state: Any, output: Any, step: int) -> None:
            screenshot_url = _save_screenshot(request.session_id, step, getattr(state, "screenshot", None))
            if not screenshot_url:
                try:
                    screenshot = await asyncio.wait_for(
                        browser.take_screenshot(format="jpeg", quality=70),
                        timeout=8,
                    )
                    screenshot_url = _save_screenshot_bytes(request.session_id, step, screenshot)
                except Exception:
                    screenshot_url = None

            event_type = _action_event_type(output)
            current_url = getattr(state, "url", target_url)
            progress = min(100, max(0, int((step / max(1, int(os.getenv("LIVE_AGENT_MAX_STEPS", "8")))) * 100)))

            nonlocal auth_steps
            if _is_auth_url(current_url):
                auth_steps += 1
                if auth_steps == 1:
                    _insert_event(
                        session_id=request.session_id,
                        audit_id=request.audit_id,
                        user_id=request.user_id,
                        event_type="status",
                        message="Agent reached an auth-only page; treating that CTA destination as verified.",
                        current_url=current_url,
                        cursor_x=60,
                        cursor_y=34,
                        scroll_y=progress,
                        screenshot_url=screenshot_url,
                        severity="low",
                        metadata={"source": "browser-worker", "step": step, "auth_guard": True},
                    )
                if auth_steps >= 2:
                    raise RuntimeError("Live agent got stuck on an auth-only page. The run was stopped before it could spend more time there.")
            else:
                auth_steps = 0

            _insert_event(
                session_id=request.session_id,
                audit_id=request.audit_id,
                user_id=request.user_id,
                event_type="screenshot" if screenshot_url else event_type,
                message=_step_message(output, step),
                current_url=current_url,
                cursor_x=(18 + step * 13) % 88,
                cursor_y=(20 + step * 9) % 82,
                scroll_y=progress,
                screenshot_url=screenshot_url,
                metadata={
                    "source": "browser-worker",
                    "step": step,
                    "event_type_hint": event_type,
                    "title": getattr(state, "title", ""),
                },
            )
            _patch_session(
                request.session_id,
                {
                    "current_url": current_url,
                    "last_heartbeat_at": _now_iso(),
                },
            )

        async def on_done(history: Any) -> None:
            final_result = ""
            try:
                final_result = history.final_result() or ""
            except Exception:
                final_result = ""

            incomplete = _result_is_incomplete(final_result)
            _insert_event(
                session_id=request.session_id,
                audit_id=request.audit_id,
                user_id=request.user_id,
                event_type="error" if incomplete else "complete",
                message=final_result[:6000] if final_result else "Agent completed the visible walkthrough.",
                current_url=target_url,
                cursor_x=86,
                cursor_y=24,
                scroll_y=100,
                severity="medium" if incomplete else None,
                metadata={"source": "browser-worker", "incomplete": incomplete},
            )
            findings = _parse_findings(final_result)
            for index, finding in enumerate(findings, start=1):
                _insert_event(
                    session_id=request.session_id,
                    audit_id=request.audit_id,
                    user_id=request.user_id,
                    event_type="finding",
                    message=finding["issue"],
                    current_url=target_url,
                    cursor_x=min(88, 20 + index * 9),
                    cursor_y=min(82, 26 + index * 7),
                    scroll_y=100,
                    severity=finding["severity"],
                    metadata={"source": "browser-worker", "fix": finding["fix"]},
                )
            _append_findings_to_audit(request.audit_id, findings, final_result)
            _patch_session(
                request.session_id,
                {
                    "status": "failed" if incomplete else "completed",
                    "summary": final_result[:6000] if final_result else "Visible browser walkthrough completed.",
                    "error_message": "Live agent reached its step limit before completing the required pages." if incomplete else None,
                    "finished_at": _now_iso(),
                },
            )
            _patch_job(
                request.job_id,
                {
                    "status": "failed" if incomplete else "completed",
                    "error_message": "Live agent reached its step limit before completing the required pages." if incomplete else None,
                    "finished_at": _now_iso(),
                },
            )

        async def should_stop() -> bool:
            try:
                status = await asyncio.to_thread(_get_session_status, request.session_id)
            except Exception:
                return False
            return status == "cancelled"

        agent = Agent(
            task=_build_task(target_url),
            llm=_build_llm(),
            browser=browser,
            use_vision=True,
            llm_timeout=int(os.getenv("LIVE_AGENT_LLM_TIMEOUT_SECONDS", "30")),
            step_timeout=int(os.getenv("LIVE_AGENT_STEP_TIMEOUT_SECONDS", "35")),
            max_actions_per_step=3,
            register_new_step_callback=on_step,
            register_done_callback=on_done,
            register_should_stop_callback=should_stop,
            enable_planning=False,
            use_judge=False,
        )

        await asyncio.wait_for(
            agent.run(max_steps=int(os.getenv("LIVE_AGENT_MAX_STEPS", "24"))),
            timeout=int(os.getenv("LIVE_AGENT_RUN_TIMEOUT_SECONDS", "180")),
        )
    except Exception as exc:
        message = str(exc)
        _insert_event(
            session_id=request.session_id,
            audit_id=request.audit_id,
            user_id=request.user_id,
            event_type="error",
            message=message[:700],
            current_url=target_url,
            severity="high",
            metadata={"source": "browser-worker"},
        )
        _patch_session(
            request.session_id,
            {
                "status": "failed",
                "error_message": message[:1000],
                "finished_at": _now_iso(),
            },
        )
        _patch_job(
            request.job_id,
            {
                "status": "failed",
                "error_message": message[:1000],
                "finished_at": _now_iso(),
            },
        )
    finally:
        close_fn = getattr(browser, "close", None)
        if close_fn:
            result = close_fn()
            if asyncio.iscoroutine(result):
                await result


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Audo live agent worker is running.",
        "endpoint": "POST /run-session",
        "polling": _get_bool_env("LIVE_AGENT_POLL_JOBS", False),
        "worker_id": _worker_id(),
    }


@app.post("/run-session")
async def run_session(request: Request, payload: RunSessionRequest, background_tasks: BackgroundTasks):
    expected_token = os.getenv("LIVE_AGENT_WORKER_TOKEN", "").strip()
    if expected_token:
        auth_header = request.headers.get("authorization", "")
        if auth_header != f"Bearer {expected_token}":
            raise HTTPException(status_code=401, detail="Unauthorized worker request")

    background_tasks.add_task(_run_browser_agent, payload)
    return {"ok": True, "session_id": payload.session_id}


async def _poll_jobs_forever() -> None:
    interval = float(os.getenv("LIVE_AGENT_POLL_INTERVAL_SECONDS", "2.5"))
    while True:
        try:
            job = await asyncio.to_thread(_claim_next_job)
            if job:
                request = RunSessionRequest(
                    session_id=str(job["session_id"]),
                    audit_id=str(job["audit_id"]),
                    user_id=str(job["user_id"]),
                    target_url=str(job["target_url"]),
                    job_id=str(job["id"]),
                )
                await _run_browser_agent(request)
            else:
                await asyncio.sleep(interval)
        except Exception as exc:
            print(f"[live-agent-worker] poll error: {exc}")
            await asyncio.sleep(interval)


@app.on_event("startup")
async def start_job_poller() -> None:
    if _get_bool_env("LIVE_AGENT_POLL_JOBS", False):
        asyncio.create_task(_poll_jobs_forever())


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("LIVE_AGENT_WORKER_PORT", "8001"))
    host = os.getenv("LIVE_AGENT_WORKER_HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
