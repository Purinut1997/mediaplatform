import { neon } from '@neondatabase/serverless'

export type Env = {
  DATABASE_URL?: string
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
    create index if not exists media_status_topic_idx on media(status, topic)
  `

  await sql`
    create index if not exists media_access_idx on media(access_level)
  `

  await seedInitialData(env)
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
