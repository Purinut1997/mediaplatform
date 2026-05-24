create table if not exists categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists media (
  id serial primary key,
  title text not null,
  slug text not null unique,
  topic text not null,
  access_level text not null check (access_level in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก')),
  status text not null default 'เผยแพร่' check (status in ('เผยแพร่', 'แบบร่าง', 'ซ่อน')),
  price integer not null default 0,
  downloads integer not null default 0,
  views integer not null default 0,
  rating numeric(2, 1) not null default 5.0,
  cover_url text not null,
  source_type text not null default 'Google Drive',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_links (
  id serial primary key,
  media_id integer not null references media(id) on delete cascade,
  label text not null,
  type text not null,
  url text not null,
  preview_url text,
  access_level text not null default 'สาธารณะ',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id serial primary key,
  actor text not null default 'system',
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id serial primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'member' check (role in ('superadmin', 'admin', 'member')),
  access_level text not null default 'สมาชิก' check (access_level in ('สมาชิก', 'VIP')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists media_status_topic_idx on media(status, topic);
create index if not exists media_access_idx on media(access_level);
create index if not exists sessions_user_idx on sessions(user_id, expires_at);
