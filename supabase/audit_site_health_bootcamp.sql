-- Temporary bootcamp ETL fields.
-- Adds nightly domain health status columns populated by Azure Data Factory + Databricks.

alter table public.audits
  add column if not exists site_health_status text,
  add column if not exists site_health_http_status integer,
  add column if not exists site_health_latency_ms integer,
  add column if not exists site_health_error text,
  add column if not exists site_health_final_url text,
  add column if not exists site_health_checked_at timestamptz;

create index if not exists idx_audits_site_health_checked_at
  on public.audits(site_health_checked_at desc);

create index if not exists idx_audits_site_health_status
  on public.audits(site_health_status);
