import { requireSuperAdmin, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, randomHex, type Env } from '../../_lib/db'

type BackupRow = Record<string, unknown>
type BackupPayload = {
  action?: 'preview' | 'commit'
  confirm?: boolean
  mode?: 'merge' | 'replace'
  replaceTables?: string[]
  backup?: {
    data?: Partial<Record<'media' | 'mediaLinks' | 'mediaEvents' | 'mediaReviews' | 'userFavorites' | 'tags' | 'mediaTags' | 'categories' | 'users' | 'vipRequests' | 'notifications' | 'settings', BackupRow[]>>
  } & Partial<Record<'media' | 'mediaLinks' | 'mediaEvents' | 'mediaReviews' | 'userFavorites' | 'tags' | 'mediaTags' | 'categories' | 'users' | 'vipRequests' | 'notifications' | 'settings', BackupRow[]>>
}

const text = (value: unknown, fallback = '') => String(value ?? fallback).trim()
const int = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const replaceableTables = new Set([
  'media',
  'mediaLinks',
  'mediaEvents',
  'mediaReviews',
  'userFavorites',
  'tags',
  'mediaTags',
  'categories',
  'vipRequests',
  'notifications',
  'settings',
])

function tagSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'tag'
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return `${base}-${hash.toString(36)}`
}

function readData(payload: BackupPayload) {
  const source = payload.backup?.data ?? payload.backup ?? {}
  return {
    media: Array.isArray(source.media) ? source.media : [],
    mediaLinks: Array.isArray(source.mediaLinks) ? source.mediaLinks : [],
    mediaEvents: Array.isArray(source.mediaEvents) ? source.mediaEvents : [],
    mediaReviews: Array.isArray(source.mediaReviews) ? source.mediaReviews : [],
    userFavorites: Array.isArray(source.userFavorites) ? source.userFavorites : [],
    tags: Array.isArray(source.tags) ? source.tags : [],
    mediaTags: Array.isArray(source.mediaTags) ? source.mediaTags : [],
    categories: Array.isArray(source.categories) ? source.categories : [],
    users: Array.isArray(source.users) ? source.users : [],
    vipRequests: Array.isArray(source.vipRequests) ? source.vipRequests : [],
    notifications: Array.isArray(source.notifications) ? source.notifications : [],
    settings: Array.isArray(source.settings) ? source.settings : [],
  }
}

function readReplaceTables(payload: BackupPayload) {
  if (payload.mode !== 'replace') return []
  return Array.from(new Set(payload.replaceTables ?? [])).filter((table) => replaceableTables.has(table))
}

function preview(data: ReturnType<typeof readData>, replaceTables: string[] = []) {
  return {
    categories: data.categories.length,
    media: data.media.length,
    mediaLinks: data.mediaLinks.length,
    mediaEvents: data.mediaEvents.length,
    mediaReviews: data.mediaReviews.length,
    userFavorites: data.userFavorites.length,
    tags: data.tags.length,
    mediaTags: data.mediaTags.length,
    users: data.users.length,
    vipRequests: data.vipRequests.length,
    notifications: data.notifications.length,
    settings: data.settings.length,
    mode: replaceTables.length ? 'replace' : 'merge',
    replaceTables,
    warnings: [
      replaceTables.length
        ? `โหมด replace จะล้างเฉพาะตารางที่เลือก: ${replaceTables.join(', ')}`
        : 'โหมด restore นี้เป็นแบบ merge และไม่ลบข้อมูลเดิม',
      'ผู้ใช้ใหม่จากไฟล์ backup ที่ไม่มี password_hash จะถูกข้ามเพื่อความปลอดภัย',
      'คำขอ VIP จะนำเข้าแบบกันซ้ำจาก email และ created_at',
    ],
  }
}

async function clearSelectedTables(sql: ReturnType<typeof getSql>, tables: string[]) {
  const selected = new Set(tables)
  if (!selected.size) return

  if (selected.has('media')) {
    await sql`delete from media`
  } else {
    if (selected.has('mediaEvents')) await sql`delete from media_events`
    if (selected.has('mediaReviews')) await sql`delete from media_reviews`
    if (selected.has('userFavorites')) await sql`delete from user_favorites`
    if (selected.has('mediaLinks')) await sql`delete from media_links`
    if (selected.has('mediaTags')) await sql`delete from media_tags`
  }

  if (selected.has('tags')) {
    await sql`delete from media_tags`
    await sql`delete from tags`
  }
  if (selected.has('vipRequests')) await sql`delete from vip_requests`
  if (selected.has('notifications')) await sql`delete from notifications`
  if (selected.has('categories')) await sql`delete from categories`
  if (selected.has('settings')) await sql`delete from app_settings`
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
    const replaceTables = readReplaceTables(payload)
    const summary = preview(data, replaceTables)

    if (payload.action !== 'commit') {
      return Response.json({ ok: true, preview: summary })
    }

    if (!payload.confirm) {
      return Response.json({ ok: false, error: 'Restore ต้องยืนยัน confirm ก่อนนำเข้า' }, { status: 400 })
    }

    const sql = getSql(env)
    const mediaIdMap = new Map<number, number>()
    const tagIdMap = new Map<number, number>()
    const userIdMap = new Map<number, number>()
    let skippedUsers = 0
    await clearSelectedTables(sql, replaceTables)

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

    for (const tagRow of data.tags) {
      const name = text(tagRow.name)
      if (!name) continue
      const [tag] = await sql`
        insert into tags (name, slug)
        values (${name}, ${tagSlug(name)})
        on conflict (name) do update set name = excluded.name
        returning id
      `
      if (tag?.id && Number.isFinite(Number(tagRow.id))) {
        tagIdMap.set(Number(tagRow.id), Number(tag.id))
      }
    }

    for (const mediaTag of data.mediaTags) {
      const mediaId = mediaIdMap.get(Number(mediaTag.media_id))
      const tagId = tagIdMap.get(Number(mediaTag.tag_id))
      if (!mediaId || !tagId) continue
      await sql`
        insert into media_tags (media_id, tag_id)
        values (${mediaId}, ${tagId})
        on conflict do nothing
      `
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

    for (const eventRow of data.mediaEvents) {
      const mediaId = mediaIdMap.get(Number(eventRow.media_id))
      const eventType = text(eventRow.event_type)
      if (!mediaId || !['view', 'download'].includes(eventType)) continue
      await sql`
        insert into media_events (media_id, user_email, event_type, created_at)
        values (
          ${mediaId},
          ${text(eventRow.user_email) || null},
          ${eventType},
          ${text(eventRow.created_at) || new Date().toISOString()}
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
          if (Number.isFinite(Number(user.id))) {
            userIdMap.set(Number(user.id), Number(existing.id))
          }
        } else {
          skippedUsers += 1
        }
        continue
      }
      const [restoredUser] = await sql`
        insert into users (name, email, password_hash, role, access_level, status)
        values (${text(user.name, email)}, ${email}, ${text(user.password_hash, await hashPassword(randomHex(16)))}, ${text(user.role, 'member')}, ${text(user.access_level, 'สมาชิก')}, ${text(user.status, 'disabled')})
        on conflict (email) do update set
          name = excluded.name,
          role = case when users.role = 'superadmin' then users.role else excluded.role end,
          access_level = excluded.access_level,
          status = excluded.status,
          updated_at = now()
        returning id
      `
      if (restoredUser?.id && Number.isFinite(Number(user.id))) {
        userIdMap.set(Number(user.id), Number(restoredUser.id))
      }
    }

    for (const favorite of data.userFavorites) {
      const userId = userIdMap.get(Number(favorite.user_id))
      const mediaId = mediaIdMap.get(Number(favorite.media_id))
      if (!userId || !mediaId) continue
      await sql`
        insert into user_favorites (user_id, media_id, created_at)
        values (${userId}, ${mediaId}, ${text(favorite.created_at) || new Date().toISOString()})
        on conflict (user_id, media_id) do update set created_at = excluded.created_at
      `
    }

    for (const review of data.mediaReviews) {
      const userId = userIdMap.get(Number(review.user_id))
      const mediaId = mediaIdMap.get(Number(review.media_id))
      const rating = int(review.rating)
      if (!userId || !mediaId || rating < 1 || rating > 5) continue
      await sql`
        insert into media_reviews (media_id, user_id, rating, comment, created_at, updated_at)
        values (${mediaId}, ${userId}, ${rating}, ${text(review.comment)}, ${text(review.created_at) || new Date().toISOString()}, ${text(review.updated_at) || new Date().toISOString()})
        on conflict (media_id, user_id) do update set rating = excluded.rating, comment = excluded.comment, updated_at = excluded.updated_at
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

    for (const notification of data.notifications) {
      const title = text(notification.title)
      const fingerprint = text(notification.fingerprint)
      if (!title || !fingerprint) continue
      await sql`
        insert into notifications (
          audience, type, title, detail, tone, target_type, target_id, fingerprint, read_at, created_at
        )
        values (
          ${text(notification.audience, 'superadmin')},
          ${text(notification.type, 'system')},
          ${title},
          ${text(notification.detail)},
          ${text(notification.tone, 'sky')},
          ${text(notification.target_type) || null},
          ${text(notification.target_id) || null},
          ${fingerprint},
          ${text(notification.read_at) || null},
          ${text(notification.created_at) || new Date().toISOString()}
        )
        on conflict (fingerprint) do update set
          title = excluded.title,
          detail = excluded.detail,
          tone = excluded.tone,
          target_type = excluded.target_type,
          target_id = excluded.target_id,
          read_at = excluded.read_at
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
