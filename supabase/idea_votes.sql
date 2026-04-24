create table if not exists public.idea_votes (
  id bigint generated always as identity primary key,
  idea_key text not null,
  vote text not null check (vote in ('up', 'down')),
  client_id text not null,
  context text,
  created_at timestamptz not null default now()
);

create unique index if not exists idea_votes_unique_per_client
  on public.idea_votes (idea_key, client_id);

create index if not exists idea_votes_idea_created_idx
  on public.idea_votes (idea_key, created_at desc);

alter table public.idea_votes enable row level security;

drop policy if exists "Allow anonymous insert idea votes" on public.idea_votes;
create policy "Allow anonymous insert idea votes"
  on public.idea_votes
  for insert
  to anon, authenticated
  with check (true);
