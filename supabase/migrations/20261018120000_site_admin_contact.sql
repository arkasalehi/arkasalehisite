-- Contact inbox + public cover uploads for the site admin.
-- Does not drop shop or shorts tables. Apply in the Supabase SQL editor; this file is not auto-applied.
-- Admin role stays on profiles.role. Clients cannot change it: protect_profile_role resets
-- role/email unless is_admin(), and role changes go through set_profile_role.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint contact_messages_name_len check (char_length(name) between 2 and 80),
  constraint contact_messages_email_len check (char_length(email) between 5 and 180),
  constraint contact_messages_body_len check (char_length(message) between 10 and 4000)
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read" on public.contact_messages
  for select using (public.is_admin());

drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update" on public.contact_messages
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contact admin delete" on public.contact_messages;
create policy "contact admin delete" on public.contact_messages
  for delete using (public.is_admin());

-- No insert policy. Public writes go through submit_contact_message (security definer).

create or replace function public.submit_contact_message(p_name text, p_email text, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := left(trim(coalesce(p_name, '')), 80);
  clean_email text := left(lower(trim(coalesce(p_email, ''))), 180);
  clean_message text := left(trim(coalesce(p_message, '')), 4000);
  new_id uuid;
begin
  if char_length(clean_name) < 2 or char_length(clean_message) < 10 then
    raise exception 'INVALID';
  end if;
  if clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID';
  end if;
  if not public.hit_rate_limit('contact:' || clean_email, 5, 3600) then
    raise exception 'RATE';
  end if;

  insert into public.contact_messages (name, email, message)
  values (clean_name, clean_email, clean_message)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

drop policy if exists "site media public read" on storage.objects;
create policy "site media public read" on storage.objects
  for select using (bucket_id = 'site-media');

drop policy if exists "site media admin insert" on storage.objects;
create policy "site media admin insert" on storage.objects
  for insert with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site media admin update" on storage.objects;
create policy "site media admin update" on storage.objects
  for update using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site media admin delete" on storage.objects;
create policy "site media admin delete" on storage.objects
  for delete using (bucket_id = 'site-media' and public.is_admin());
