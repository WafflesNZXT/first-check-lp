create table if not exists public.audit_workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  audit_id text not null,
  title text not null,
  notes text,
  source_issue text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'in_review', 'done', 'wont_fix')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_email text,
  due_date date,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_workflow_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.audit_workflow_tasks(id) on delete cascade,
  text text not null,
  author_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_workflow_tasks_audit_id on public.audit_workflow_tasks(audit_id);
create index if not exists idx_audit_workflow_tasks_status on public.audit_workflow_tasks(status);
create index if not exists idx_audit_workflow_tasks_assigned_email on public.audit_workflow_tasks(assigned_email);
create index if not exists idx_audit_workflow_task_comments_task_id on public.audit_workflow_task_comments(task_id);

create or replace function public.set_audit_workflow_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_audit_workflow_tasks_updated_at on public.audit_workflow_tasks;
create trigger trg_audit_workflow_tasks_updated_at
before update on public.audit_workflow_tasks
for each row
execute function public.set_audit_workflow_tasks_updated_at();

alter table public.audit_workflow_tasks enable row level security;
alter table public.audit_workflow_task_comments enable row level security;

drop policy if exists audit_workflow_tasks_select on public.audit_workflow_tasks;
create policy audit_workflow_tasks_select
on public.audit_workflow_tasks
for select
using (
  created_by_user_id = auth.uid()
  or (
    auth.jwt() ->> 'email' is not null
    and lower(assigned_email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists audit_workflow_tasks_insert on public.audit_workflow_tasks;
create policy audit_workflow_tasks_insert
on public.audit_workflow_tasks
for insert
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.audits a
    where a.id::text = audit_workflow_tasks.audit_id
      and (
        a.user_id = auth.uid()
        or (
          auth.jwt() ->> 'email' is not null
          and exists (
            select 1
            from public.audit_shares s
            where s.audit_id::text = audit_workflow_tasks.audit_id
              and lower(s.shared_with_email) = lower(auth.jwt() ->> 'email')
              and lower(s.access_level) = 'edit'
          )
        )
      )
  )
  and (
    assigned_email is null
    or exists (
      select 1
      from public.audit_shares s
      where s.audit_id::text = audit_workflow_tasks.audit_id
        and lower(s.shared_with_email) = lower(audit_workflow_tasks.assigned_email)
    )
  )
);

drop policy if exists audit_workflow_tasks_update on public.audit_workflow_tasks;
create policy audit_workflow_tasks_update
on public.audit_workflow_tasks
for update
using (
  created_by_user_id = auth.uid()
  or (
    auth.jwt() ->> 'email' is not null
    and lower(assigned_email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  (
    created_by_user_id = auth.uid()
    and (
      assigned_email is null
      or exists (
        select 1
        from public.audit_shares s
        where s.audit_id::text = audit_workflow_tasks.audit_id
          and lower(s.shared_with_email) = lower(audit_workflow_tasks.assigned_email)
      )
    )
  )
  or (
    auth.jwt() ->> 'email' is not null
    and lower(assigned_email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists audit_workflow_tasks_delete on public.audit_workflow_tasks;
create policy audit_workflow_tasks_delete
on public.audit_workflow_tasks
for delete
using (
  created_by_user_id = auth.uid()
);

drop policy if exists audit_workflow_task_comments_select on public.audit_workflow_task_comments;
create policy audit_workflow_task_comments_select
on public.audit_workflow_task_comments
for select
using (
  exists (
    select 1
    from public.audit_workflow_tasks t
    where t.id = audit_workflow_task_comments.task_id
      and (
        t.created_by_user_id = auth.uid()
        or (
          auth.jwt() ->> 'email' is not null
          and lower(t.assigned_email) = lower(auth.jwt() ->> 'email')
        )
      )
  )
);

drop policy if exists audit_workflow_task_comments_insert on public.audit_workflow_task_comments;
create policy audit_workflow_task_comments_insert
on public.audit_workflow_task_comments
for insert
with check (
  exists (
    select 1
    from public.audit_workflow_tasks t
    where t.id = audit_workflow_task_comments.task_id
      and (
        t.created_by_user_id = auth.uid()
        or (
          auth.jwt() ->> 'email' is not null
          and lower(t.assigned_email) = lower(auth.jwt() ->> 'email')
        )
      )
  )
);
