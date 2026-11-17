create table if not exists public.study_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('N1','N2','N3','N4','N5')),
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  primary key (user_id, level)
);
alter table public.study_progress enable row level security;
create policy "Read own progress" on public.study_progress for select to authenticated using (auth.uid() = user_id);
create policy "Create own progress" on public.study_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own progress" on public.study_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
