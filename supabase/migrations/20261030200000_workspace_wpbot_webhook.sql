-- wpbot webhook: forward the owner's messages in the private wpbot channel to the assistant.
-- Non-destructive: adds one nullable column, two triggers, and enables pg_net. Deletes nothing.
--
-- Secrets are NOT in this file. Create them once in the SQL editor (values are not stored in git):
--   select vault.create_secret('<webhook url>', 'wpbot_webhook_url', 'wpbot routine webhook URL');
--   select vault.create_secret('<sender key>',  'wpbot_webhook_key', 'wpbot routine webhook bearer key');
-- Until both exist the trigger does nothing.
--
-- Replies from wpbot are rows in public.workspace_messages with
--   channel_id = the wpbot channel, user_id = the super admin's profile id, bot_id = workspace_bots.id of wpbot.
-- They are inserted server-side (service role / postgres). Signed-in clients cannot set bot_id.

create extension if not exists pg_net with schema extensions;

alter table public.workspace_messages
  add column if not exists bot_id uuid references public.workspace_bots(id) on delete set null;

create index if not exists workspace_messages_bot_id_idx
  on public.workspace_messages (bot_id) where bot_id is not null;

-- Clients may not impersonate a bot.
create or replace function public.workspace_messages_guard_bot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.bot_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_messages_guard_bot on public.workspace_messages;
create trigger workspace_messages_guard_bot
  before insert or update of bot_id on public.workspace_messages
  for each row execute function public.workspace_messages_guard_bot();

create or replace function public.wpbot_forward_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault, pg_temp
as $$
declare
  v_bot public.workspace_bots%rowtype;
  v_url text;
  v_key text;
  v_email text;
  v_name text;
  v_tenant uuid;
begin
  if new.bot_id is not null then
    return new;
  end if;

  select * into v_bot
  from public.workspace_bots
  where channel_id = new.channel_id and username = 'wpbot'
  limit 1;
  if not found then
    return new;
  end if;

  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'wpbot_webhook_url' limit 1;
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'wpbot_webhook_key' limit 1;
    if v_url is null or v_key is null then
      return new;
    end if;

    select email, display_name into v_email, v_name from public.profiles where id = new.user_id;
    select tenant_id into v_tenant from public.workspace_channels where id = new.channel_id;

    perform net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'source', 'workspace.arkasalehi.com',
        'event', 'wpbot.message',
        'bot_id', v_bot.id,
        'channel_id', new.channel_id,
        'message_id', new.id,
        'author_id', new.user_id,
        'author_email', v_email,
        'author_name', v_name,
        'text', new.body,
        'kind', new.kind,
        'file_name', new.file_name,
        'file_url', new.file_url,
        'reply_to', new.reply_to,
        'created_at', new.created_at,
        'tenant_id', v_tenant
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      timeout_milliseconds := 10000
    );
  exception when others then
    raise warning 'wpbot_forward_message failed: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke all on function public.wpbot_forward_message() from public, anon, authenticated;
revoke all on function public.workspace_messages_guard_bot() from public, anon, authenticated;

drop trigger if exists wpbot_forward_message on public.workspace_messages;
create trigger wpbot_forward_message
  after insert on public.workspace_messages
  for each row execute function public.wpbot_forward_message();
