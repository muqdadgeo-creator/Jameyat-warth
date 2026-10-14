alter table public.app_users
  add column if not exists last_visit_at timestamptz,
  add column if not exists last_activity_at timestamptz;

create index if not exists app_users_last_activity_at_idx
  on public.app_users (last_activity_at desc);
