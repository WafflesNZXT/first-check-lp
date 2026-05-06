create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  user_id uuid not null,
  target_url text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  mode text not null default 'preview' check (mode in ('preview', 'browser_worker', 'github_fix')),
  current_url text,
  summary text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade,
  user_id uuid not null,
  event_type text not null check (event_type in ('status', 'navigate', 'scroll', 'click', 'input', 'finding', 'screenshot', 'code_scan', 'complete', 'error')),
  message text not null,
  current_url text,
  cursor_x numeric,
  cursor_y numeric,
  scroll_y numeric,
  screenshot_url text,
  severity text check (severity is null or severity in ('low', 'medium', 'high', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_sessions_audit_id_created_at
  on public.agent_sessions(audit_id, created_at desc);

create index if not exists idx_agent_sessions_user_id_created_at
  on public.agent_sessions(user_id, created_at desc);

create index if not exists idx_agent_events_session_id_created_at
  on public.agent_events(session_id, created_at asc);

create index if not exists idx_agent_events_audit_id_created_at
  on public.agent_events(audit_id, created_at asc);

create or replace function public.set_agent_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_agent_sessions_updated_at on public.agent_sessions;
create trigger trg_agent_sessions_updated_at
before update on public.agent_sessions
for each row
execute function public.set_agent_sessions_updated_at();

alter table public.agent_sessions enable row level security;
alter table public.agent_events enable row level security;

drop policy if exists agent_sessions_select on public.agent_sessions;
create policy agent_sessions_select
on public.agent_sessions
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.audit_shares s
    where s.audit_id::text = agent_sessions.audit_id::text
      and lower(s.shared_with_email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists agent_sessions_insert on public.agent_sessions;
create policy agent_sessions_insert
on public.agent_sessions
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.audits a
    where a.id = agent_sessions.audit_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists agent_sessions_update on public.agent_sessions;
create policy agent_sessions_update
on public.agent_sessions
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists agent_events_select on public.agent_events;
create policy agent_events_select
on public.agent_events
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.audit_shares s
    where s.audit_id::text = agent_events.audit_id::text
      and lower(s.shared_with_email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists agent_events_insert on public.agent_events;
create policy agent_events_insert
on public.agent_events
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.agent_sessions s
    where s.id = agent_events.session_id
      and s.audit_id = agent_events.audit_id
      and s.user_id = auth.uid()
  )
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.agent_sessions;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.agent_events;
  exception
    when duplicate_object then null;
  end;
end $$;
