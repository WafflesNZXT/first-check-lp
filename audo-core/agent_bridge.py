from fastapi import FastAPI, HTTPException
from browser_use import Agent, Browser, BrowserProfile, ChatOpenAI
import os
from pathlib import Path
import requests

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


def _derive_audit_status(result_text: str) -> str:
    normalized = (result_text or "").lower()
    if "red" in normalized:
        return "Red"
    if "yellow" in normalized:
        return "Yellow"
    if "green" in normalized:
        return "Green"
    return "Yellow"


def _looks_like_provider_404(text: str) -> bool:
    normalized = (text or "").lower()
    return "404 not found" in normalized and "nginx" in normalized


def _build_llm(api_key: str, model: str) -> ChatOpenAI:
    base_url = os.getenv("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4")
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
    )


def _normalize_errors(raw_errors: list | None) -> list[str]:
    normalized: list[str] = []
    for err in raw_errors or []:
        if err is None:
            continue
        text = str(err).strip()
        if text:
            normalized.append(text)
    return normalized


def _build_butterbase_insert_url() -> str | None:
    explicit_url = os.getenv("BUTTERBASE_API_URL")
    if explicit_url:
        return explicit_url

    base_url = os.getenv("BUTTERBASE_BASE_URL")
    app_id = os.getenv("BUTTERBASE_APP_ID")
    table = os.getenv("BUTTERBASE_AUDITS_TABLE", "audits")

    if not base_url or not app_id:
        return None

    normalized_base = base_url.rstrip("/")
    return f"{normalized_base}/v1/{app_id}/{table}"


def _log_audit_to_butterbase(payload: dict) -> dict:
    insert_url = _build_butterbase_insert_url()
    if not insert_url:
        return {
            "saved": False,
            "reason": "Missing Butterbase config. Set BUTTERBASE_API_URL or BUTTERBASE_BASE_URL + BUTTERBASE_APP_ID.",
        }

    headers = {"Content-Type": "application/json"}
    service_key = os.getenv("BUTTERBASE_SERVICE_KEY")
    if service_key:
        headers["Authorization"] = f"Bearer {service_key}"

    timeout_seconds = int(os.getenv("BUTTERBASE_TIMEOUT_SECONDS", "12"))
    response = requests.post(
        insert_url,
        json=payload,
        headers=headers,
        timeout=timeout_seconds,
    )

    if 200 <= response.status_code < 300:
        return {
            "saved": True,
            "endpoint": insert_url,
            "status_code": response.status_code,
        }

    error_body = response.text[:500]
    return {
        "saved": False,
        "endpoint": insert_url,
        "status_code": response.status_code,
        "error": error_body,
    }


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Agent bridge is running.",
        "docs": "/docs",
        "endpoint": "POST /run-audit?url=https://example.com",
    }

# Configure the browser to be VISIBLE with reduced screenshot payload settings
browser = Browser(
    browser_profile=BrowserProfile(
        headless=False,
        window_size={"width": 1280, "height": 720},
        viewport={"width": 1280, "height": 720},
    )
)

@app.post("/run-audit")
async def run_audit(url: str):
    try:
        zai_api_key = os.getenv("ZAI_API_KEY")

        if not zai_api_key:
            raise HTTPException(status_code=500, detail="Missing ZAI_API_KEY environment variable")

        primary_model = os.getenv("ZAI_MODEL", "glm-5.1")
        fallback_model = os.getenv("ZAI_FALLBACK_MODEL", "glm-4.5v")

        def _create_agent(model: str) -> Agent:
            llm = _build_llm(api_key=zai_api_key, model=model)
            return Agent(
                task=f"Navigate to {url}, find the 'Get Started' button, click it, and evaluate if the page loads correctly (Status: Green, Yellow, or Red).",
                llm=llm,
                browser=browser,
                use_vision=True,
                llm_screenshot_size=(1024, 576),
                llm_timeout=300,
            )

        model_used = primary_model
        history = await _create_agent(primary_model).run()

        error_messages = _normalize_errors(history.errors())
        combined_error_text = "\n".join(error_messages + [history.final_result() or ""])
        if (
            _looks_like_provider_404(combined_error_text)
            and fallback_model
            and fallback_model != primary_model
        ):
            history = await _create_agent(fallback_model).run()
            model_used = fallback_model

        final_result = history.final_result() or ""
        errors = _normalize_errors(history.errors())
        status = _derive_audit_status(final_result)
        if history.has_errors() and status == "Green":
            status = "Red"

        butterbase_payload = {
            "url": url,
            "status": status,
            "result": final_result,
            "errors": {
                "messages": errors,
                "count": len(errors),
            },
            "model": model_used,
        }

        db_log = {"saved": False, "reason": "Not attempted"}
        try:
            db_log = _log_audit_to_butterbase(butterbase_payload)
        except (requests.RequestException, ValueError) as log_exc:
            db_log = {
                "saved": False,
                "reason": f"Failed to send audit to Butterbase: {log_exc}",
            }

        return {
            "status": status,
            "log": final_result,
            "errors": errors,
            "model": model_used,
            "db_log": db_log,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"run_audit failed: {exc}") from exc

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="::", port=port)