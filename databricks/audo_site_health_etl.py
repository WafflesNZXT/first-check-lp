# Databricks notebook source
# Audo Bootcamp Nightly Site Health ETL
# Extract: get audit URLs from audo/Supabase.
# Transform: check whether each site is reachable and classify failures.
# Load: write the status back to the audits table through a protected audo API.

# COMMAND ----------

import time
from urllib.parse import urlparse

import requests
from pyspark.sql import functions as F

dbutils.widgets.text("base_url", "https://useaudo.com")
dbutils.widgets.text("export_token", "")
dbutils.widgets.text("limit", "100")
dbutils.widgets.text("timeout_seconds", "12")

base_url = dbutils.widgets.get("base_url").rstrip("/")
export_token = dbutils.widgets.get("export_token")
limit = int(dbutils.widgets.get("limit") or "100")
timeout_seconds = int(dbutils.widgets.get("timeout_seconds") or "12")

headers = {"x-audo-export-token": export_token}

print("Audo Site Health ETL")
print("Base URL:", base_url)
print("Limit:", limit)
print("Timeout seconds:", timeout_seconds)

# COMMAND ----------

extract_url = f"{base_url}/api/integrations/bootcamp/site-health?limit={limit}"
extract_response = requests.get(extract_url, headers=headers, timeout=60)
extract_response.raise_for_status()

payload = extract_response.json()
audits_raw = payload.get("audits") or []

print("Extracted audit URL rows:", len(audits_raw))

# COMMAND ----------

def normalize_url(value):
    text = str(value or "").strip()
    if not text:
        return None
    if text.startswith("http://") or text.startswith("https://"):
        return text
    return f"https://{text}"


def classify_site(audit):
    audit_id = audit.get("id")
    original_url = audit.get("website_url")
    normalized_url = normalize_url(original_url)
    checked_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    if not normalized_url:
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "invalid_url",
            "httpStatus": None,
            "latencyMs": None,
            "checkedAt": checked_at,
            "error": "Missing URL",
            "finalUrl": None,
        }

    parsed = urlparse(normalized_url)
    if not parsed.netloc:
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "invalid_url",
            "httpStatus": None,
            "latencyMs": None,
            "checkedAt": checked_at,
            "error": "Invalid URL",
            "finalUrl": normalized_url,
        }

    start = time.perf_counter()
    try:
        response = requests.get(
            normalized_url,
            timeout=timeout_seconds,
            allow_redirects=True,
            headers={
                "User-Agent": "AudoBootcampSiteHealth/1.0 (+https://useaudo.com)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        latency_ms = int((time.perf_counter() - start) * 1000)

        if 200 <= response.status_code < 400:
            status = "running"
            error = None
        elif response.status_code in (401, 403):
            status = "running"
            error = f"Protected page returned HTTP {response.status_code}"
        else:
            status = "not_loading"
            error = f"HTTP {response.status_code}"

        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": status,
            "httpStatus": int(response.status_code),
            "latencyMs": latency_ms,
            "checkedAt": checked_at,
            "error": error,
            "finalUrl": response.url,
        }
    except requests.exceptions.SSLError as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "security_error",
            "httpStatus": None,
            "latencyMs": latency_ms,
            "checkedAt": checked_at,
            "error": str(exc)[:650],
            "finalUrl": normalized_url,
        }
    except requests.exceptions.Timeout as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "timeout",
            "httpStatus": None,
            "latencyMs": latency_ms,
            "checkedAt": checked_at,
            "error": str(exc)[:650],
            "finalUrl": normalized_url,
        }
    except requests.exceptions.RequestException as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "not_loading",
            "httpStatus": None,
            "latencyMs": latency_ms,
            "checkedAt": checked_at,
            "error": str(exc)[:650],
            "finalUrl": normalized_url,
        }
    except Exception as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "auditId": audit_id,
            "websiteUrl": original_url,
            "status": "unknown_error",
            "httpStatus": None,
            "latencyMs": latency_ms,
            "checkedAt": checked_at,
            "error": str(exc)[:650],
            "finalUrl": normalized_url,
        }


statuses = [classify_site(audit) for audit in audits_raw]

print("Transformed site health rows:", len(statuses))

# COMMAND ----------

load_url = f"{base_url}/api/integrations/bootcamp/site-health"
load_response = requests.post(load_url, headers=headers, json={"statuses": statuses}, timeout=90)
load_response.raise_for_status()
load_result = load_response.json()

print("Load result:", load_result)

# COMMAND ----------

site_health = spark.createDataFrame(statuses)

status_counts = (
    site_health
    .groupBy("status")
    .count()
    .orderBy(F.desc("count"))
)

latest_checks = (
    site_health
    .select("websiteUrl", "status", "httpStatus", "latencyMs", "error", "finalUrl", "checkedAt")
    .orderBy(F.asc("websiteUrl"))
)

display(status_counts)
display(latest_checks)

# COMMAND ----------

dbutils.notebook.exit({
    "status": "ok",
    "extracted": len(audits_raw),
    "loaded": int(load_result.get("updated") or 0),
    "failed": int(load_result.get("failed") or 0),
})
