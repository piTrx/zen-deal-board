create table public.telegram_messages (
  update_id bigint primary key,
  chat_id bigint not null,
  user_id bigint,
  username text,
  first_name text,
  last_name text,
  chat_title text,
  text text,
  raw_update jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_telegram_messages_chat_id on public.telegram_messages (chat_id);
create index idx_telegram_messages_created_at on public.telegram_messages (created_at desc);

grant select on public.telegram_messages to authenticated;
grant all on public.telegram_messages to service_role;

alter table public.telegram_messages enable row level security;

create policy "Allow authenticated users to read all Telegram messages"
on public.telegram_messages for select to authenticated using (true);

create policy "Allow service role to manage Telegram messages"
on public.telegram_messages for all to service_role using (true) with check (true);