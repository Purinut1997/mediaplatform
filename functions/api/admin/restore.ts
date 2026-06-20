import { requireSuperAdmin, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, randomHex, type Env } from '../../_lib/db'
import { MEDIA_ACCESS_LEVELS, mediaPrice, mediaStatus } from '../../_lib/media-validation'
import { safeHttpUrl } from '../../_lib/url'

type BackupRow = Record<string, unknown>
type BackupPayload = {
  action?: 'preview' | 'commit'
  confirm?: boolean
  mode?: 'merge' | 'replace'
  replaceTables?: string[]
  backup?: {
    data?: Partial<Record<'media' | 'mediaLinks' | 'mediaEvents' | 'mediaReviews' | 'mediaIssues' | 'userFavorites' | 'userServices' | 'tags' | 'mediaTags' | 'categories' | 'users' | 'vipRequests' | 'purchaseRequests' | 'mediaPurchases' | 'refundRequests' | 'notifications' | 'settings', BackupRow[]>>
  } & Partial<Record<'media' | 'mediaLinks' | 'mediaEvents' | 'mediaReviews' | 'mediaIssues' | 'userFavorites' | 'userServices' | 'tags' | 'mediaTags' | 'categories' | 'users' | 'vipRequests' | 'purchaseRequests' | 'mediaPurchases' | 'refundRequests' | 'notifications' | 'settings', BackupRow[]>>
}

const text = (value: unknown, fallback = '') => String(value ?? fallback).trim()
const int = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback
const choice = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) => {
  const normalized = text(value, fallback)
  return allowed.includes(normalized) ? (normalized as T[number]) : fallback
}
const USER_ROLES = ['admin', 'member'] as const
const USER_ACCESS_LEVELS = ['สมาชิก', 'VIP'] as const
const USER_STATUSES = ['active', 'disabled'] as const
const VIP_STATUSES = ['pending', 'approved', 'rejected'] as const
const PURCHASE_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'refunded'] as const
const PURCHASE_STATUSES = ['active', 'refunded', 'revoked'] as const
const REFUND_STATUSES = ['pending', 'reviewing', 'approved', 'rejected', 'completed'] as const
const MEDIA_ISSUE_TYPES = ['broken_link', 'incorrect_content', 'copyright', 'other'] as const
const MEDIA_ISSUE_STATUSES = ['pending', 'reviewing', 'resolved', 'rejected'] as const
const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'
const replaceableTables = new Set([
  'media',
  'mediaLinks',
  'mediaEvents',
  'mediaReviews',
  'userFavorites',
  'userServices',
  'tags',
  'mediaTags',
  'categories',
  'vipRequests',
  'purchaseRequests',
  'mediaPurchases',
  'refundRequests',
  'mediaIssues',
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
    userServices: Array.isArray(source.userServices) ? source.userServices : [],
    tags: Array.isArray(source.tags) ? source.tags : [],
    mediaTags: Array.isArray(source.mediaTags) ? source.mediaTags : [],
    categories: Array.isArray(source.categories) ? source.categories : [],
    users: Array.isArray(source.users) ? source.users : [],
    vipRequests: Array.isArray(source.vipRequests) ? source.vipRequests : [],
    purchaseRequests: Array.isArray(source.purchaseRequests) ? source.purchaseRequests : [],
    mediaPurchases: Array.isArray(source.mediaPurchases) ? source.mediaPurchases : [],
    refundRequests: Array.isArray(source.refundRequests) ? source.refundRequests : [],
    mediaIssues: Array.isArray(source.mediaIssues) ? source.mediaIssues : [],
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
    userServices: data.userServices.length,
    tags: data.tags.length,
    mediaTags: data.mediaTags.length,
    users: data.users.length,
    vipRequests: data.vipRequests.length,
    purchaseRequests: data.purchaseRequests.length,
    mediaPurchases: data.mediaPurchases.length,
    refundRequests: data.refundRequests.length,
    mediaIssues: data.mediaIssues.length,
    notifications: data.notifications.length,
    settings: data.settings.length,
    mode: replaceTables.length ? 'replace' : 'merge',
    replaceTables,
    warnings: [
      replaceTables.length
        ? `โหมด Replace ถูกปิดเพื่อป้องกันข้อมูลหาย: ${replaceTables.join(', ')}`
        : 'โหมด restore นี้เป็นแบบ merge และไม่ลบข้อมูลเดิม',
      'ผู้ใช้ใหม่จากไฟล์ backup ที่ไม่มี password_hash จะถูกข้ามเพื่อความปลอดภัย',
      'คำขอ VIP จะนำเข้าแบบกันซ้ำจาก email และ created_at',
      'คำขอซื้อและสิทธิ์ซื้อแยกจะนำเข้าเฉพาะรายการที่จับคู่สมาชิกและสื่อได้',
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
    const replaceTables = readReplaceTables(payload)
    const summary = preview(data, replaceTables)

    if (payload.action !== 'commit') {
      return Response.json({ ok: true, preview: summary })
    }

    if (!payload.confirm) {
      return Response.json({ ok: false, error: 'Restore ต้องยืนยัน confirm ก่อนนำเข้า' }, { status: 400 })
    }
    if (replaceTables.length) {
      return Response.json(
        {
          ok: false,
          error: 'ปิดโหมด Replace ชั่วคราวเพื่อป้องกันข้อมูลหาย กรุณาใช้ Merge หรือกู้คืนผ่าน Neon Restore',
        },
        { status: 409 },
      )
    }

    const sql = getSql(env)
    const mediaIdMap = new Map<number, number>()
    const tagIdMap = new Map<number, number>()
    const userIdMap = new Map<number, number>()
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
      const access = choice(item.access_level, MEDIA_ACCESS_LEVELS, 'สาธารณะ')
      let status = 'ฉบับร่าง'
      let price = 0
      try {
        status = mediaStatus(item.status)
        price = mediaPrice(item.price)
      } catch {
        // Backup เก่าหรือค่าที่แก้เองจะถูกคืนเป็นฉบับร่างราคา 0 เพื่อให้ผู้ดูแลตรวจอีกครั้ง
      }
      const rawRating = Number(item.rating ?? 5)
      const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(0, rawRating)) : 5
      const [row] = await sql`
        insert into media (
          title, slug, topic, access_level, status, price, downloads, views, rating,
          cover_url, source_type, description, available_from, available_until, download_limit,
          deleted_at, deleted_by, created_at, updated_at
        )
        values (
          ${title},
          ${slug},
          ${text(item.topic, 'โรงเรียน')},
          ${access},
          ${status},
          ${price},
          ${Math.max(0, int(item.downloads))},
          ${Math.max(0, int(item.views))},
          ${rating},
          ${safeHttpUrl(item.cover_url, DEFAULT_COVER_URL)},
          ${text(item.source_type, 'Google Drive')},
          ${text(item.description)},
          ${text(item.available_from) || null},
          ${text(item.available_until) || null},
          ${Math.max(0, int(item.download_limit))},
          ${text(item.deleted_at) || null},
          ${text(item.deleted_by) || null},
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
          available_from = excluded.available_from,
          available_until = excluded.available_until,
          download_limit = excluded.download_limit,
          deleted_at = excluded.deleted_at,
          deleted_by = excluded.deleted_by,
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
      const url = safeHttpUrl(link.url)
      if (!mediaId || !url) continue
      await sql`delete from media_links where media_id = ${mediaId} and url = ${url}`
      await sql`
        insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
        values (
          ${mediaId},
          ${text(link.label, 'ไฟล์สื่อ')},
          ${text(link.type, 'Google Drive')},
          ${url},
          ${safeHttpUrl(link.preview_url) || null},
          ${choice(link.access_level, MEDIA_ACCESS_LEVELS, 'สาธารณะ')},
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
      const role = choice(user.role, USER_ROLES, 'member')
      const access = choice(user.access_level, USER_ACCESS_LEVELS, 'สมาชิก')
      const status = choice(user.status, USER_STATUSES, 'disabled')
      if (!user.password_hash) {
        const [existing] = await sql`select id from users where lower(email) = ${email} limit 1`
        if (existing) {
          await sql`
            update users
            set name = ${text(user.name, email)}, role = ${role}, access_level = ${access},
                vip_expires_at = ${text(user.vip_expires_at) || null},
                eservice_limit_override = ${user.eservice_limit_override === null || user.eservice_limit_override === undefined ? null : Math.max(0, Math.min(1000, int(user.eservice_limit_override)))},
                status = ${status}, updated_at = now()
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
      const passwordHash = text(user.password_hash) || await hashPassword(randomHex(16))
      const [restoredUser] = await sql`
        insert into users (name, email, password_hash, role, access_level, vip_expires_at, eservice_limit_override, status)
        values (${text(user.name, email)}, ${email}, ${passwordHash}, ${role}, ${access}, ${text(user.vip_expires_at) || null}, ${user.eservice_limit_override === null || user.eservice_limit_override === undefined ? null : Math.max(0, Math.min(1000, int(user.eservice_limit_override)))}, ${status})
        on conflict (email) do update set
          name = excluded.name,
          role = case when users.role = 'superadmin' then users.role else excluded.role end,
          access_level = excluded.access_level,
          vip_expires_at = excluded.vip_expires_at,
          eservice_limit_override = excluded.eservice_limit_override,
          status = excluded.status,
          updated_at = now()
        returning id
      `
      if (restoredUser?.id && Number.isFinite(Number(user.id))) {
        userIdMap.set(Number(user.id), Number(restoredUser.id))
      }
    }

    for (const service of data.userServices) {
      const userId = userIdMap.get(Number(service.user_id))
      const title = text(service.title).slice(0, 80)
      const url = safeHttpUrl(text(service.url))
      if (!userId || !title || !url) continue
      const source = service.source === 'purchased' ? 'purchased' : 'custom'
      const createdAt = text(service.created_at) || new Date().toISOString()
      await sql`
        insert into user_services (user_id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at)
        select ${userId}, ${title}, ${url}, ${text(service.description).slice(0, 160)}, ${text(service.category, 'งานทั่วไป').slice(0, 40)}, ${text(service.icon_data_url)}, ${source}, ${Boolean(service.pinned)}, ${int(service.sort_order)}, ${createdAt}, ${text(service.updated_at) || createdAt}
        where not exists (select 1 from user_services where user_id = ${userId} and url = ${url} and title = ${title})
      `
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
        insert into vip_requests (user_id, name, email, phone, slip_name, slip_data_url, status, created_at, updated_at)
        select null, ${text(requestRow.name)}, ${email}, ${text(requestRow.phone) || null}, ${text(requestRow.slip_name) || null}, ${text(requestRow.slip_data_url) || null}, ${choice(requestRow.status, VIP_STATUSES, 'pending')}, ${createdAt}, ${text(requestRow.updated_at) || createdAt}
        where not exists (
          select 1 from vip_requests where lower(email) = ${email} and created_at = ${createdAt}
        )
      `
    }

    for (const requestRow of data.purchaseRequests) {
      const userId = userIdMap.get(Number(requestRow.user_id))
      const mediaId = mediaIdMap.get(Number(requestRow.media_id))
      const createdAt = text(requestRow.created_at) || new Date().toISOString()
      if (!userId || !mediaId) continue
      await sql`
        insert into purchase_requests (user_id, media_id, amount, slip_name, slip_data_url, status, created_at, updated_at)
        select ${userId}, ${mediaId}, ${Math.max(0, int(requestRow.amount))}, ${text(requestRow.slip_name) || null}, ${text(requestRow.slip_data_url) || null},
               ${choice(requestRow.status, PURCHASE_REQUEST_STATUSES, 'pending')}, ${createdAt},
               ${text(requestRow.updated_at) || createdAt}
        where not exists (
          select 1 from purchase_requests
          where user_id = ${userId} and media_id = ${mediaId} and created_at = ${createdAt}
        )
      `
    }

    for (const purchaseRow of data.mediaPurchases) {
      const userId = userIdMap.get(Number(purchaseRow.user_id))
      const mediaId = mediaIdMap.get(Number(purchaseRow.media_id))
      if (!userId || !mediaId) continue
      await sql`
        insert into media_purchases (
          user_id, media_id, amount, status, granted_by, granted_at, refunded_at, note
        )
        values (
          ${userId}, ${mediaId}, ${Math.max(0, int(purchaseRow.amount))},
          ${choice(purchaseRow.status, PURCHASE_STATUSES, 'active')},
          ${text(purchaseRow.granted_by, 'restore')},
          ${text(purchaseRow.granted_at) || new Date().toISOString()},
          ${text(purchaseRow.refunded_at) || null},
          ${text(purchaseRow.note)}
        )
        on conflict (user_id, media_id) do update set
          amount = excluded.amount,
          status = excluded.status,
          granted_by = excluded.granted_by,
          granted_at = excluded.granted_at,
          refunded_at = excluded.refunded_at,
          note = excluded.note
      `
    }

    for (const refundRow of data.refundRequests) {
      const userId = userIdMap.get(Number(refundRow.user_id))
      const createdAt = text(refundRow.created_at) || new Date().toISOString()
      if (!userId || !text(refundRow.reference_text) || !text(refundRow.reason)) continue
      await sql`
        insert into refund_requests (user_id, request_type, reference_text, reason, detail, contact, status, admin_note, created_at, updated_at)
        select ${userId}, ${text(refundRow.request_type) === 'media' ? 'media' : 'vip'}, ${text(refundRow.reference_text)}, ${text(refundRow.reason)}, ${text(refundRow.detail)}, ${text(refundRow.contact)}, ${choice(refundRow.status, REFUND_STATUSES, 'pending')}, ${text(refundRow.admin_note)}, ${createdAt}, ${text(refundRow.updated_at) || createdAt}
        where not exists (select 1 from refund_requests where user_id = ${userId} and created_at = ${createdAt})
      `
    }

    for (const issueRow of data.mediaIssues) {
      const userId = userIdMap.get(Number(issueRow.user_id))
      const mediaId = mediaIdMap.get(Number(issueRow.media_id))
      const createdAt = text(issueRow.created_at) || new Date().toISOString()
      if (!userId || !mediaId || !text(issueRow.detail)) continue
      await sql`
        insert into media_issue_reports (media_id, user_id, issue_type, detail, contact, status, admin_note, created_at, updated_at)
        select ${mediaId}, ${userId}, ${choice(issueRow.issue_type, MEDIA_ISSUE_TYPES, 'other')}, ${text(issueRow.detail)}, ${text(issueRow.contact)}, ${choice(issueRow.status, MEDIA_ISSUE_STATUSES, 'pending')}, ${text(issueRow.admin_note)}, ${createdAt}, ${text(issueRow.updated_at) || createdAt}
        where not exists (select 1 from media_issue_reports where user_id = ${userId} and media_id = ${mediaId} and created_at = ${createdAt})
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
