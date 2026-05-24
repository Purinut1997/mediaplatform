import { neon } from '@neondatabase/serverless'

export type Env = {
  DATABASE_URL?: string
  ADMIN_WRITE_TOKEN?: string
  ADMIN_BOOTSTRAP_EMAIL?: string
  ADMIN_BOOTSTRAP_PASSWORD?: string
  ADMIN_BOOTSTRAP_NAME?: string
}

export function getSql(env: Env) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  return neon(env.DATABASE_URL)
}

export async function ensureSchema(env: Env) {
  const sql = getSql(env)

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
    create table if not exists vip_requests (
      id serial primary key,
      user_id integer references users(id) on delete set null,
      name text not null,
      email text not null,
      phone text,
      slip_name text,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
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
    create index if not exists media_status_topic_idx on media(status, topic)
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

  await seedInitialData(env)
  await seedSettings(env)
  await seedBootstrapAdmin(env)
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
      iterations: 120000,
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
  const email = env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password = env.ADMIN_BOOTSTRAP_PASSWORD

  if (!email || !password) return

  const sql = getSql(env)
  const passwordHash = await hashPassword(password)
  const name = env.ADMIN_BOOTSTRAP_NAME?.trim() || 'MIKPURINUT Super Admin'

  await sql`
    insert into users (name, email, password_hash, role, access_level, status)
    values (${name}, ${email}, ${passwordHash}, 'superadmin', 'VIP', 'active')
    on conflict (email) do update set
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = 'superadmin',
      access_level = 'VIP',
      status = 'active',
      updated_at = now()
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
        vipPrice: 0,
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
          vipPrice: 0,
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
        'เผยแพร่',
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
        'เผยแพร่',
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
        'เผยแพร่',
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
        'แบบร่าง',
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
