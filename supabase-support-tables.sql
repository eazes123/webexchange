-- Run this in your Supabase SQL Editor
-- Project: zohpdublgrayucsfcdaj
-- Creates support_chats and support_messages tables for live customer support

create table if not exists support_chats (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references users(id) on delete cascade not null,
  user_name   text not null default '',
  user_email  text not null default '',
  status      text not null default 'pending',
  last_message text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,
  constraint support_chats_status_check check (status in ('pending', 'active', 'closed'))
);

create index if not exists support_chats_user_id_idx on support_chats (user_id);
create index if not exists support_chats_status_idx  on support_chats (status, created_at desc);

create table if not exists support_messages (
  id       uuid default gen_random_uuid() primary key,
  chat_id  uuid references support_chats(id) on delete cascade not null,
  sender   text not null,
  content  text not null,
  created_at timestamptz default now() not null,
  constraint support_messages_sender_check check (sender in ('user', 'admin'))
);

create index if not exists support_messages_chat_idx on support_messages (chat_id, created_at);
