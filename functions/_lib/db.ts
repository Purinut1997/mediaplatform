import { neon } from '@neondatabase/serverless'

const PBKDF2_ITERATIONS = 100000

export type Env = {
  DATABASE_URL?: string
  ADMIN_WRITE_TOKEN?: string
  ADMIN_BOOTSTRAP_EMAIL?: string
  ADMIN_BOOTSTRAP_PASSWORD?: string
  ADMIN_BOOTSTRAP_NAME?: string
  CRON_SECRET?: string
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  TURNSTILE_SECRET_KEY?: string
  TURNSTILE_SITE_KEY?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  APP_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

let schemaReady = false
const SCHEMA_VERSION = '2026.06.19.2'

export function getSql(env: Env) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  return neon(env.DATABASE_URL)
}

export async function ensureSchema(env: Env) {
  if (schemaReady) return

  const sql = getSql(env)
  const writeSchemaVersion = async () => {
    await sql`
      insert into app_settings (key, value, updated_at)
      values ('schema_version', ${JSON.stringify({ version: SCHEMA_VERSION })}::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `
  }
  try {
    const [state] = await sql`
      select value->>'version' as version
      from app_settings
      where key = 'schema_version'
      limit 1
    `
    if (state?.version === SCHEMA_VERSION) {
      schemaReady = true
      return
    }
    if (state?.version) {
      await sql`alter table media add column if not exists deleted_at timestamptz`
      await sql`alter table media add column if not exists deleted_by text`
      await sql`alter table media add column if not exists available_from timestamptz`
      await sql`alter table media add column if not exists available_until timestamptz`
      await sql`alter table media add column if not exists download_limit integer not null default 0`
      await sql`create index if not exists media_deleted_updated_idx on media(deleted_at, updated_at desc)`
      await sql`
        create table if not exists media_issue_reports (
          id serial primary key,
          media_id integer not null references media(id) on delete cascade,
          user_id integer not null references users(id) on delete cascade,
          issue_type text not null check (issue_type in ('broken_link', 'incorrect_content', 'copyright', 'other')),
          detail text not null,
          contact text not null default '',
          status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
          admin_note text not null default '',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `
      await sql`create index if not exists media_issue_reports_user_idx on media_issue_reports(user_id, created_at desc)`
      await sql`create index if not exists media_issue_reports_status_idx on media_issue_reports(status, created_at desc)`
      await sql`alter table users add column if not exists vip_expires_at timestamptz`
      await sql`alter table vip_requests add column if not exists slip_data_url text`
      await sql`alter table purchase_requests add column if not exists slip_data_url text`
      await sql`
        create table if not exists refund_requests (
          id serial primary key,
          user_id integer not null references users(id) on delete cascade,
          request_type text not null check (request_type in ('vip', 'media')),
          reference_text text not null,
          reason text not null,
          detail text not null default '',
          contact text not null default '',
          status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
          admin_note text not null default '',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `
      await sql`create index if not exists refund_requests_user_idx on refund_requests(user_id, created_at desc)`
      await sql`create index if not exists refund_requests_status_idx on refund_requests(status, created_at desc)`
      await sql`
        update app_settings
        set value = jsonb_set(value, '{vipLifetimeEnabled}', 'false'::jsonb, true),
            updated_at = now()
        where key = 'site'
          and not (value ? 'vipLifetimeEnabled')
      `
      await writeSchemaVersion()
      schemaReady = true
      return
    }
  } catch {
    // First deployment continues into the idempotent schema bootstrap below.
  }

  await sql`
    create table if not exists categories (
      id serial primary key,
      name text not null unique,
      slug text not null unique,
      sort_order integer not null default 0,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists media (
      id serial primary key,
      title text not null,
      slug text not null unique,
      topic text not null,
      access_level text not null check (access_level in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก')),
      status text not null default 'ฉบับร่าง' check (status in ('ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ')),
      price integer not null default 0,
      downloads integer not null default 0,
      views integer not null default 0,
      rating numeric(2, 1) not null default 5.0,
      cover_url text not null,
      source_type text not null default 'Google Drive',
      description text not null default '',
      available_from timestamptz,
      available_until timestamptz,
      download_limit integer not null default 0 check (download_limit between 0 and 1000000),
      deleted_at timestamptz,
      deleted_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
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
    )
  `

  await sql`
    create table if not exists tags (
      id serial primary key,
      name text not null unique,
      slug text not null unique,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists media_tags (
      media_id integer not null references media(id) on delete cascade,
      tag_id integer not null references tags(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (media_id, tag_id)
    )
  `

  await sql`
    create table if not exists media_events (
      id serial primary key,
      media_id integer references media(id) on delete cascade,
      user_email text,
      event_type text not null check (event_type in ('view', 'download')),
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists audit_logs (
      id serial primary key,
      actor text not null default 'system',
      action text not null,
      target_type text not null,
      target_id text,
      detail jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists error_logs (
      id serial primary key,
      source text not null,
      message text not null,
      stack text not null default '',
      detail jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists link_checks (
      id serial primary key,
      media_id integer references media(id) on delete cascade,
      media_link_id integer references media_links(id) on delete cascade,
      url text not null,
      status text not null,
      status_code integer,
      message text not null default '',
      checked_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists notifications (
      id serial primary key,
      audience text not null default 'superadmin',
      type text not null,
      title text not null,
      detail text not null,
      tone text not null default 'sky',
      target_type text,
      target_id text,
      fingerprint text not null unique,
      read_at timestamptz,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists users (
      id serial primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      role text not null default 'member' check (role in ('superadmin', 'admin', 'member')),
      access_level text not null default 'สมาชิก' check (access_level in ('สมาชิก', 'VIP')),
      vip_expires_at timestamptz,
      status text not null default 'active' check (status in ('active', 'disabled')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists sessions (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists user_favorites (
      user_id integer not null references users(id) on delete cascade,
      media_id integer not null references media(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (user_id, media_id)
    )
  `

  await sql`
    create table if not exists password_reset_tokens (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists media_reviews (
      id serial primary key,
      media_id integer not null references media(id) on delete cascade,
      user_id integer not null references users(id) on delete cascade,
      rating integer not null check (rating between 1 and 5),
      comment text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (media_id, user_id)
    )
  `

  await sql`
    create table if not exists request_limits (
      key_hash text not null,
      action text not null,
      window_started_at timestamptz not null default now(),
      attempts integer not null default 0,
      blocked_until timestamptz,
      updated_at timestamptz not null default now(),
      primary key (key_hash, action)
    )
  `

  await sql`
    create table if not exists vip_requests (
      id serial primary key,
      user_id integer references users(id) on delete set null,
      name text not null,
      email text not null,
      phone text,
      slip_name text,
      slip_data_url text,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists media_purchases (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      media_id integer not null references media(id) on delete cascade,
      amount integer not null default 0 check (amount between 0 and 10000000),
      status text not null default 'active' check (status in ('active', 'refunded', 'revoked')),
      granted_by text not null default 'system',
      granted_at timestamptz not null default now(),
      refunded_at timestamptz,
      note text not null default '',
      unique (user_id, media_id)
    )
  `

  await sql`
    create table if not exists purchase_requests (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      media_id integer not null references media(id) on delete cascade,
      amount integer not null default 0 check (amount between 0 and 10000000),
      slip_name text,
      slip_data_url text,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists refund_requests (
      id serial primary key,
      user_id integer not null references users(id) on delete cascade,
      request_type text not null check (request_type in ('vip', 'media')),
      reference_text text not null,
      reason text not null,
      detail text not null default '',
      contact text not null default '',
      status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
      admin_note text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists media_issue_reports (
      id serial primary key,
      media_id integer not null references media(id) on delete cascade,
      user_id integer not null references users(id) on delete cascade,
      issue_type text not null check (issue_type in ('broken_link', 'incorrect_content', 'copyright', 'other')),
      detail text not null,
      contact text not null default '',
      status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
      admin_note text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists app_settings (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    update media set
      access_level = case when access_level in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก') then access_level else 'สาธารณะ' end,
      status = case
        when status = 'เผยแพร่' then 'เผยแพร่แล้ว'
        when status = 'แบบร่าง' then 'ฉบับร่าง'
        when status = 'ซ่อน' then 'ซ่อนชั่วคราว'
        when status in ('ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ') then status
        else 'ฉบับร่าง'
      end,
      price = case when price between 0 and 10000000 then price else 0 end,
      rating = case when rating between 0 and 5 then rating else 5 end
    where access_level not in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก')
      or status not in ('ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ')
      or price not between 0 and 10000000
      or rating not between 0 and 5
  `
  await sql`
    update media_links
    set access_level = 'สาธารณะ'
    where access_level not in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก')
  `
  await sql`
    update users set
      role = case when role in ('superadmin', 'admin', 'member') then role else 'member' end,
      access_level = case when access_level in ('สมาชิก', 'VIP') then access_level else 'สมาชิก' end,
      status = case when status in ('active', 'disabled') then status else 'disabled' end
    where role not in ('superadmin', 'admin', 'member')
      or access_level not in ('สมาชิก', 'VIP')
      or status not in ('active', 'disabled')
  `
  await sql`alter table users add column if not exists vip_expires_at timestamptz`
  await sql`alter table vip_requests add column if not exists slip_data_url text`
  await sql`alter table purchase_requests add column if not exists slip_data_url text`
  await sql`
    update vip_requests
    set status = 'pending'
    where status not in ('pending', 'approved', 'rejected')
  `
  await sql`
    do $$
    begin
      if not exists (select 1 from pg_constraint where conname = 'media_access_level_check') then
        alter table media add constraint media_access_level_check check (access_level in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'media_status_check') then
        alter table media add constraint media_status_check check (status in ('ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'media_price_check') then
        alter table media add constraint media_price_check check (price between 0 and 10000000);
      end if;
      if not exists (select 1 from pg_constraint where conname = 'media_rating_check') then
        alter table media add constraint media_rating_check check (rating between 0 and 5);
      end if;
      if not exists (select 1 from pg_constraint where conname = 'media_links_access_level_check') then
        alter table media_links add constraint media_links_access_level_check check (access_level in ('สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'users_role_check') then
        alter table users add constraint users_role_check check (role in ('superadmin', 'admin', 'member'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'users_access_level_check') then
        alter table users add constraint users_access_level_check check (access_level in ('สมาชิก', 'VIP'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'users_status_check') then
        alter table users add constraint users_status_check check (status in ('active', 'disabled'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'vip_requests_status_check') then
        alter table vip_requests add constraint vip_requests_status_check check (status in ('pending', 'approved', 'rejected'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'media_purchases_status_check') then
        alter table media_purchases add constraint media_purchases_status_check check (status in ('active', 'refunded', 'revoked'));
      end if;
      if not exists (select 1 from pg_constraint where conname = 'purchase_requests_status_check') then
        alter table purchase_requests add constraint purchase_requests_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded'));
      end if;
    end $$;
  `

  await sql`
    create index if not exists media_status_topic_idx on media(status, topic)
  `
  await sql`
    create index if not exists media_deleted_updated_idx on media(deleted_at, updated_at desc)
  `

  await sql`
    create index if not exists media_access_idx on media(access_level)
  `

  await sql`
    create index if not exists sessions_user_idx on sessions(user_id, expires_at)
  `

  await sql`
    create index if not exists vip_requests_status_idx on vip_requests(status, created_at)
  `
  await sql`
    create index if not exists media_purchases_user_status_idx on media_purchases(user_id, status, granted_at desc)
  `
  await sql`
    create index if not exists purchase_requests_status_idx on purchase_requests(status, created_at desc)
  `
  await sql`create index if not exists refund_requests_user_idx on refund_requests(user_id, created_at desc)`
  await sql`create index if not exists refund_requests_status_idx on refund_requests(status, created_at desc)`
  await sql`create index if not exists media_issue_reports_user_idx on media_issue_reports(user_id, created_at desc)`
  await sql`create index if not exists media_issue_reports_status_idx on media_issue_reports(status, created_at desc)`
  await sql`
    create index if not exists users_vip_expiry_idx on users(access_level, vip_expires_at)
  `

  await sql`
    create index if not exists audit_logs_created_idx on audit_logs(created_at desc)
  `

  await sql`
    create index if not exists error_logs_created_idx on error_logs(created_at desc)
  `

  await sql`
    create index if not exists link_checks_checked_idx on link_checks(checked_at desc)
  `

  await sql`
    create index if not exists media_tags_tag_idx on media_tags(tag_id, media_id)
  `

  await sql`
    create index if not exists media_events_type_created_idx on media_events(event_type, created_at desc)
  `

  await sql`
    create index if not exists media_events_media_created_idx on media_events(media_id, created_at desc)
  `

  await sql`
    create index if not exists notifications_inbox_idx on notifications(audience, read_at, created_at desc)
  `

  await sql`
    create index if not exists user_favorites_user_created_idx on user_favorites(user_id, created_at desc)
  `

  await sql`
    create index if not exists password_reset_tokens_user_idx on password_reset_tokens(user_id, expires_at desc)
  `

  await sql`
    create index if not exists media_reviews_media_idx on media_reviews(media_id, updated_at desc)
  `

  await sql`
    create index if not exists request_limits_updated_idx on request_limits(updated_at)
  `

  await cleanupExpiredSecurityData(sql)
  await seedInitialData(env)
  await seedSettings(env)
  try {
    await seedBootstrapAdmin(env)
  } catch (error) {
    console.error('Bootstrap admin failed', error)
  }
  await writeSchemaVersion()

  schemaReady = true
}

async function cleanupExpiredSecurityData(sql: ReturnType<typeof getSql>) {
  await Promise.all([
    sql`delete from sessions where expires_at < now()`,
    sql`delete from password_reset_tokens where expires_at < now() - interval '1 day'`,
    sql`delete from request_limits where updated_at < now() - interval '2 days'`,
  ])
}

export async function hashPassword(password: string, salt = randomHex(16)) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    material,
    256,
  )

  return `pbkdf2:${salt}:${bytesToHex(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split(':')
  if (method !== 'pbkdf2' || !salt || !hash) return false
  const nextHash = await hashPassword(password, salt)
  return timingSafeEqual(nextHash, storedHash)
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return bytesToHex(new Uint8Array(digest))
}

export function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

async function seedBootstrapAdmin(env: Env) {
  const primaryEmail = env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password = env.ADMIN_BOOTSTRAP_PASSWORD?.trim()
  if (!primaryEmail || !password) return

  const sql = getSql(env)
  const passwordHash = await hashPassword(password)
  const name = env.ADMIN_BOOTSTRAP_NAME?.trim() || 'MIKPURINUT Super Admin'
  await sql`
    insert into users (name, email, password_hash, role, access_level, status)
    values (${name}, ${primaryEmail}, ${passwordHash}, 'superadmin', 'VIP', 'active')
    on conflict (email) do update set
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = 'superadmin',
      access_level = 'VIP',
      status = 'active',
      updated_at = now()
  `
  await sql`
    update users
    set status = 'disabled', updated_at = now()
    where lower(email) = 'admin' and lower(email) <> ${primaryEmail} and role = 'superadmin'
  `
}

async function seedSettings(env: Env) {
  const sql = getSql(env)

  await sql`
    insert into app_settings (key, value)
    values (
      'site',
      ${JSON.stringify({
        vipRegistrationEnabled: false,
        heroEyebrow: 'AI / Cyber / School Operations',
        heroTitle: 'ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย',
        heroDescription:
          'ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์ Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว',
        heroImageUrl:
          'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png',
        heroPrimaryLabel: 'เปิดคลังสื่อ',
        heroSecondaryLabel: 'ดูสิทธิ์ VIP',
        footerBrandName: 'MIKPURINUT Nexus',
        footerDescription: 'ระบบคลังสื่อสมาชิกสำหรับโรงเรียนและผู้จัดอบรม รองรับลิงก์ Drive, Sheet, YouTube และหลังบ้านผู้ดูแล',
        footerSystemTitle: 'ระบบ',
        footerSystemText: 'Public · Member · VIP · Admin',
        vipPrice: 0,
        vipLifetimeEnabled: false,
        vipUpgradeBadge: 'UPGRADE TO VIP',
        vipUpgradeTitle: 'ปลดล็อกคลังสื่อขั้นสูงภายหลังได้ทุกเมื่อ',
        vipUpgradeDescription: 'ส่งคำขอจากบัญชีสมาชิกเดิม ประวัติและรายการโปรดทั้งหมดจะยังอยู่ครบ',
        vipUpgradeBenefits: 'เข้าถึงสื่อสมาชิกและ VIP\nรับสิทธิ์ตามระยะเวลาที่ผู้ดูแลอนุมัติ\nติดตามสถานะคำขอได้จากหน้านี้',
        vipTermsText: '1. สิทธิ์ VIP ผูกกับบัญชีผู้สมัครและห้ามโอน ให้ยืม จำหน่ายต่อ หรือเผยแพร่สื่อแก่บุคคลอื่น\n2. ระยะเวลาสิทธิ์เริ่มนับหลังผู้ดูแลตรวจสอบหลักฐานและอนุมัติคำขอแล้ว\n3. ผู้สมัครต้องแนบหลักฐานการชำระเงินที่ถูกต้อง ชัดเจน และเป็นรายการจริง\n4. การส่งข้อมูลหรือหลักฐานอันเป็นเท็จอาจทำให้คำขอถูกปฏิเสธ ระงับสิทธิ์ หรือปิดบัญชี\n5. การขอคืนเงินเป็นไปตามระยะเวลาที่ระบบแสดง และขึ้นอยู่กับการใช้งานสิทธิ์จริงรวมถึงข้อกำหนดตามกฎหมาย\n6. ผู้ดูแลอาจปรับปรุงบริการหรือเงื่อนไข โดยจะแจ้งข้อความฉบับปัจจุบันให้ตรวจสอบก่อนยอมรับ\n7. เมื่อเลือกยอมรับ ถือว่าผู้สมัครได้อ่าน เข้าใจ และยอมรับเงื่อนไขฉบับนี้แล้ว',
        refundRequestEnabled: true,
        refundContactTitle: 'ศูนย์ช่วยเหลือและขอคืนเงิน',
        refundInstructions: 'กรุณาแจ้งอีเมลบัญชี รายการหรือสื่อที่ต้องการคืนเงิน วันที่ชำระเงิน เหตุผล และหลักฐานที่เกี่ยวข้อง ผู้ดูแลจะตรวจสอบตามลำดับโดยไม่ขอรหัสผ่านหรือข้อมูลบัตรของคุณ',
        refundFormUrl: '',
        refundContactEmail: '',
        refundLineUrl: '',
        refundContactPhone: '',
        vipQrUrl: '',
        vipBankName: 'พร้อมเพย์ (PromptPay)',
        vipAccountNumber: '',
        vipAccountName: 'MIKPURINUT',
        vipPaymentTitle: 'ข้อมูลการชำระเงิน VIP',
        vipPaymentSubtitle: 'กรุณาโอนเงินและแนบสลิปเพื่อยืนยันสิทธิ์',
        vipSlipLabel: 'แนบสลิปโอนเงิน',
        vipAgreementLabel: 'ข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน',
        vipSubmitLabel: 'ลงทะเบียนสมาชิก',
      })}::jsonb
    )
    on conflict (key) do nothing
  `

  await sql`
    update app_settings
    set
      value = value
        || ${JSON.stringify({
          vipRegistrationEnabled: false,
          heroEyebrow: 'AI / Cyber / School Operations',
          heroTitle: 'ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย',
          heroDescription:
            'ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์ Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว',
          heroImageUrl:
            'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png',
          heroPrimaryLabel: 'เปิดคลังสื่อ',
          heroSecondaryLabel: 'ดูสิทธิ์ VIP',
          footerBrandName: 'MIKPURINUT Nexus',
          footerDescription: 'ระบบคลังสื่อสมาชิกสำหรับโรงเรียนและผู้จัดอบรม รองรับลิงก์ Drive, Sheet, YouTube และหลังบ้านผู้ดูแล',
          footerSystemTitle: 'ระบบ',
          footerSystemText: 'Public · Member · VIP · Admin',
          vipPrice: 0,
          vipLifetimeEnabled: false,
          vipUpgradeBadge: 'UPGRADE TO VIP',
          vipUpgradeTitle: 'ปลดล็อกคลังสื่อขั้นสูงภายหลังได้ทุกเมื่อ',
          vipUpgradeDescription: 'ส่งคำขอจากบัญชีสมาชิกเดิม ประวัติและรายการโปรดทั้งหมดจะยังอยู่ครบ',
          vipUpgradeBenefits: 'เข้าถึงสื่อสมาชิกและ VIP\nรับสิทธิ์ตามระยะเวลาที่ผู้ดูแลอนุมัติ\nติดตามสถานะคำขอได้จากหน้านี้',
          vipTermsText: '1. สิทธิ์ VIP ผูกกับบัญชีผู้สมัครและห้ามโอน ให้ยืม จำหน่ายต่อ หรือเผยแพร่สื่อแก่บุคคลอื่น\n2. ระยะเวลาสิทธิ์เริ่มนับหลังผู้ดูแลตรวจสอบหลักฐานและอนุมัติคำขอแล้ว\n3. ผู้สมัครต้องแนบหลักฐานการชำระเงินที่ถูกต้อง ชัดเจน และเป็นรายการจริง\n4. การส่งข้อมูลหรือหลักฐานอันเป็นเท็จอาจทำให้คำขอถูกปฏิเสธ ระงับสิทธิ์ หรือปิดบัญชี\n5. การขอคืนเงินเป็นไปตามระยะเวลาที่ระบบแสดง และขึ้นอยู่กับการใช้งานสิทธิ์จริงรวมถึงข้อกำหนดตามกฎหมาย\n6. ผู้ดูแลอาจปรับปรุงบริการหรือเงื่อนไข โดยจะแจ้งข้อความฉบับปัจจุบันให้ตรวจสอบก่อนยอมรับ\n7. เมื่อเลือกยอมรับ ถือว่าผู้สมัครได้อ่าน เข้าใจ และยอมรับเงื่อนไขฉบับนี้แล้ว',
          refundRequestEnabled: true,
          refundContactTitle: 'ศูนย์ช่วยเหลือและขอคืนเงิน',
          refundInstructions: 'กรุณาแจ้งอีเมลบัญชี รายการหรือสื่อที่ต้องการคืนเงิน วันที่ชำระเงิน เหตุผล และหลักฐานที่เกี่ยวข้อง ผู้ดูแลจะตรวจสอบตามลำดับโดยไม่ขอรหัสผ่านหรือข้อมูลบัตรของคุณ',
          refundFormUrl: '',
          refundContactEmail: '',
          refundLineUrl: '',
          refundContactPhone: '',
          vipPaymentTitle: 'ข้อมูลการชำระเงิน VIP',
          vipPaymentSubtitle: 'กรุณาโอนเงินและแนบสลิปเพื่อยืนยันสิทธิ์',
          vipSlipLabel: 'แนบสลิปโอนเงิน',
          vipAgreementLabel: 'ข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน',
          vipSubmitLabel: 'ลงทะเบียนสมาชิก',
        })}::jsonb,
      updated_at = now()
    where key = 'site'
      and value->>'vipRegistrationEnabled' = 'true'
      and value->>'vipPrice' = '499'
      and coalesce(value->>'vipQrUrl', '') = ''
  `
}

async function seedInitialData(env: Env) {
  const sql = getSql(env)

  await sql`
    insert into categories (name, slug, sort_order)
    values
      ('AI', 'ai', 10),
      ('AppScript', 'appscript', 20),
      ('โรงเรียน', 'school', 30),
      ('งานเอกสาร', 'documents', 40),
      ('อบรม', 'training', 50)
    on conflict (slug) do nothing
  `

  await sql`
    insert into media (
      title,
      slug,
      topic,
      access_level,
      status,
      price,
      downloads,
      views,
      rating,
      cover_url,
      source_type,
      description
    )
    values
      (
        'ชุดเอกสารอบรม AI สำหรับครู',
        'ai-teacher-training-pack',
        'AI',
        'สาธารณะ',
        'เผยแพร่แล้ว',
        0,
        428,
        2460,
        4.9,
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        'Google Drive',
        'ไฟล์ PDF สำหรับใช้ประกอบการอบรม พร้อมตัวอย่างกิจกรรมและเอกสารแจกในห้องเรียน'
      ),
      (
        'Google Sheet ระบบเช็กชื่อออนไลน์',
        'online-attendance-google-sheet',
        'AppScript',
        'สมาชิก',
        'เผยแพร่แล้ว',
        0,
        189,
        1120,
        4.8,
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
        'Google Sheet',
        'เทมเพลต Google Sheet พร้อมแนวทางต่อยอด AppScript สำหรับงานโรงเรียน'
      ),
      (
        'วิดีโอสอนติดตั้งระบบคลังสื่อ',
        'media-platform-install-video',
        'อบรม',
        'VIP',
        'เผยแพร่แล้ว',
        0,
        76,
        890,
        5.0,
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        'YouTube',
        'วิดีโอแนะนำการติดตั้ง ใช้งาน และดูแลระบบสำหรับผู้ดูแลเว็บไซต์'
      ),
      (
        'Prompt Pack สำหรับงานบริหารโรงเรียน',
        'school-admin-prompt-pack',
        'งานเอกสาร',
        'ซื้อแยก',
        'ฉบับร่าง',
        499,
        32,
        510,
        4.7,
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        'Google Drive',
        'ชุดคำสั่งพร้อมตัวอย่างการใช้งานสำหรับจัดทำเอกสาร แผนงาน และรายงาน'
      )
    on conflict (slug) do nothing
  `
}
