# Audo Live Agent Worker

This service is the production worker for visible browser audits. It can be deployed once as a long-running service and will automatically pick up queued `agent_jobs`.

## Required Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `LIVE_AGENT_POLL_JOBS=true`

## Recommended Environment

- `LIVE_AGENT_WORKER_TOKEN`: shared secret used by the Next.js app when calling `/run-session`.
- `LIVE_AGENT_WORKER_ID`: stable name for this worker instance.
- `LIVE_AGENT_HEADLESS=true`
- `LIVE_AGENT_MAX_STEPS=24`
- `LIVE_AGENT_RUN_TIMEOUT_SECONDS=180`
- `LIVE_AGENT_BROWSER_RESTARTS=1`: restarts the browser once if browser-use reports a startup watchdog timeout.
- `LIVE_AGENT_LIVE_VIEW_URL_TEMPLATE`: optional provider URL template, for example a cloud browser live-view URL that includes `{session_id}`.

## Deployment Shape

Build and run this folder as a Docker service on a worker-friendly host such as Fly.io, Railway, Render, ECS, or another container platform.

The Next.js app should set:

- `LIVE_AGENT_WORKER_URL=https://your-worker-host`
- `LIVE_AGENT_WORKER_TOKEN=the-same-secret`

If `LIVE_AGENT_WORKER_URL` is not set, the dashboard still queues jobs in Supabase. A deployed polling worker with `LIVE_AGENT_POLL_JOBS=true` will pick them up automatically.

When `LIVE_AGENT_WORKER_URL` is set, the Next.js app claims the queued job before calling `/run-session`. This keeps a polling Fly worker from picking up the same run twice.
