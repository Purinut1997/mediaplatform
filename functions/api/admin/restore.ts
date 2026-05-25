import { requireSuperAdmin, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, randomHex, type Env } from '../../_lib/db'

type BackupRow = Record<string, unknown>
type BackupPayload = {
  action?: 'preview' | 'commit'
  confirm?: boolean
  backup?: {
    data?: Partial<Record<'media' | 'mediaLinks' | 'categories' | 'users' | 'vipRequests' | 'settings', BackupRow[]>>
  } & Partial<Record<'media' | 'mediaLinks' | 'categories' | 'users' | 'vipRequests' | 'settings', BackupRow[]>>
}

const text = (value: unknown, fallback = '') => String(value ?? fallback).trim()
const int = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function readData(payload: BackupPayload) {
  const source = payload.backup?.data ?? payload.backup ?? {}
  return {
    media: Array.isArray(source.media) ? source.media : [],
    mediaLinks: Array.isArray(source.mediaLinks) ? source.mediaLinks : [],
    categories: Array.isArray(source.categories) ? source.categories : [],
    users: Array.isArray(source.users) ? source.users : [],
    vipRequests: Array.isArray(source.vipRequests) ? source.vipRequests : [],
    settings: Array.isArray(source.settings) ? source.settings : [],
  }
}

function preview(data: ReturnType<typeof readData>) {
  return {
    categories: data.categories.length,
    media: data.media.length,
    mediaLinks: data.mediaLinks.length,
    users: data.users.length,
    vipRequests: data.vipRequests.length,
    settings: data.settings.length,
    warnings: [
      'โหมด restore นี้เป็นแบบ merge และไม่ลบข้อมูลเดิม',
      'ผู้ใช้ใหม่จากไฟล์ backup ที่ไม่มี password_hash จะถูกข้ามเพื่อความปลอดภัย',
      'คำขอ VIP จะนำเข้าแบบกันซ้ำจาก email และ created_at',
    ],
  }
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureSchema(env)
    const payload = (await request.json().catch(() => ({}))) as BackupPayload
    const data = readData(payload)
    const summary = preview(data)

    if (payload.action !== 'commit') {
      return Response.json({ ok: true, preview: summary })
    }

    if (!payload.confirm) {
      return Response.json({ ok: false, error: 'Restore ต้องยืนยัน confirm ก่อนนำเข้า' }, { status: 400 })
    }

    const sql = getSql(env)
    const mediaIdMap = new Map<number, number>()
    let skippedUsers = 0

    for (const category of data.categories) {
      const name = text(category.name)
      if (!name) continue
      await sql`
        insert into categories (name, slug, sort_order)
        values (${name}, ${text(category.slug, name.toLowerCase().replace(/\s+/g, '-'))}, ${int(category.sort_order)})
        on conflict (slug) do update set
          name = excluded.name,
          sort_order = excluded.sort_order
      `
    }

    for (const item of data.media) {
      const title = text(item.title)
      const slug = text(item.slug, `${title || 'media'}-${Date.now()}`)
      if (!title) continue
      const [row] = await sql`
        insert into media (
          title, slug, topic, access_level, status, price, downloads, views, rating,
          cover_url, source_type, description, created_at, updated_at
        )
        values (
          ${title},
          ${slug},
          ${text(item.topic, 'โรงเรียน')},
          ${text(item.access_level, 'สาธารณะ')},
          ${text(item.status, 'ฉบับร่าง')},
          ${int(item.price)},
          ${int(item.downloads)},
          ${int(item.views)},
          ${Number(item.rating ?? 5)},
          ${text(item.cover_url)},
          ${text(item.source_type, 'Google Drive')},
          ${text(item.description)},
          ${text(item.created_at) || new Date().toISOString()},
          ${text(item.updated_at) || new Date().toISOString()}
        )
        on conflict (slug) do update set
          title = excluded.title,
          topic = excluded.topic,
          access_level = excluded.access_level,
          status = excluded.status,
          price = excluded.price,
          downloads = excluded.downloads,
          views = excluded.views,
          rating = excluded.rating,
          cover_url = excluded.cover_url,
          source_type = excluded.source_type,
          description = excluded.description,
          updated_at = now()
        returning id
      `
      if (row?.id && Number.isFinite(Number(item.id))) {
        mediaIdMap.set(Number(item.id), Number(row.id))
      }
    }

    for (const link of data.mediaLinks) {
      const oldMediaId = Number(link.media_id)
      const mediaId = mediaIdMap.get(oldMediaId)
      const url = text(link.url)
      if (!mediaId || !url) continue
      await sql`delete from media_links where media_id = ${mediaId} and url = ${url}`
      await sql`
        insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
        values (
          ${mediaId},
          ${text(link.label, 'ไฟล์สื่อ')},
          ${text(link.type, 'Google Drive')},
          ${url},
          ${text(link.preview_url) || null},
          ${text(link.access_level, 'สาธารณะ')},
          ${int(link.sort_order)}
        )
      `
    }

    for (const user of data.users) {
      const email = text(user.email).toLowerCase()
      if (!email) continue
      if (!user.password_hash) {
        const [existing] = await sql`select id from users where lower(email) = ${email} limit 1`
        if (existing) {
          await sql`
            update users
            set name = ${text(user.name, email)}, role = ${text(user.role, 'member')}, access_level = ${text(user.access_level, 'สมาชิก')}, status = ${text(user.status, 'active')}, updated_at = now()
            where lower(email) = ${email} and role <> 'superadmin'
          `
        } else {
          skippedUsers += 1
        }
        continue
      }
      await sql`
        insert into users (name, email, password_hash, role, access_level, status)
        values (${text(user.name, email)}, ${email}, ${text(user.password_hash, await hashPassword(randomHex(16)))}, ${text(user.role, 'member')}, ${text(user.access_level, 'สมาชิก')}, ${text(user.status, 'disabled')})
        on conflict (email) do update set
          name = excluded.name,
          role = case when users.role = 'superadmin' then users.role else excluded.role end,
          access_level = excluded.access_level,
          status = excluded.status,
          updated_at = now()
      `
    }

    for (const requestRow of data.vipRequests) {
      const email = text(requestRow.email).toLowerCase()
      const createdAt = text(requestRow.created_at) || new Date().toISOString()
      if (!email || !text(requestRow.name)) continue
      await sql`
        insert into vip_requests (user_id, name, email, phone, slip_name, status, created_at, updated_at)
        select null, ${text(requestRow.name)}, ${email}, ${text(requestRow.phone) || null}, ${text(requestRow.slip_name) || null}, ${text(requestRow.status, 'pending')}, ${createdAt}, ${text(requestRow.updated_at) || createdAt}
        where not exists (
          select 1 from vip_requests where lower(email) = ${email} and created_at = ${createdAt}
        )
      `
    }

    for (const setting of data.settings) {
      const key = text(setting.key)
      if (!key || typeof setting.value !== 'object') continue
      await sql`
        insert into app_settings (key, value, updated_at)
        values (${key}, ${JSON.stringify(setting.value)}::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `
    }

    await writeAuditLog(env, currentUser, 'backup_restore', 'system', null, { ...summary, skippedUsers })
    return Response.json({ ok: true, restored: { ...summary, skippedUsers } })
  } catch (error) {
    await writeErrorLog(env, 'backup.restore', error)
    return Response.json({ ok: false, error: 'Restore ไม่สำเร็จ กรุณาตรวจรูปแบบไฟล์ backup' }, { status: 500 })
  }
}
