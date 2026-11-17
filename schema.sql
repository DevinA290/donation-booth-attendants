-- Donation Booth Attendants: shift sign-ups
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  shift_id text not null check (shift_id in ('s1','s2','s3','s4','s5')),
  slot int not null check (slot in (0, 1)),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz default now(),
  unique (shift_id, slot)
);

alter table public.signups enable row level security;

drop policy if exists "anon can read signups" on public.signups;
drop policy if exists "anon can add signups" on public.signups;
drop policy if exists "anon can remove signups" on public.signups;

create policy "anon can read signups" on public.signups
  for select to anon using (true);
create policy "anon can add signups" on public.signups
  for insert to anon with check (true);
create policy "anon can remove signups" on public.signups
  for delete to anon using (true);
-- No update policy on purpose.

grant select, insert, delete on public.signups to anon;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'signups'
  ) then
    alter publication supabase_realtime add table public.signups;
  end if;
end $$;

-- Seed
insert into public.signups (shift_id, slot, name) values
  ('s5', 0, 'Sudona'),
  ('s5', 1, 'Jailiah')
on conflict (shift_id, slot) do nothing;
