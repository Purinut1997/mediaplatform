import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { canAccessLevel, hasPurchasedMedia, hideProtectedLinks } from '../../_lib/media-access'
import { safeHttpUrl } from '../../_lib/url'

type FavoritePayload = {
  mediaId?: number
  favorite?: boolean
}

type MediaRow = {
  id: number
  title: string
  slug: string
  topic: string
  access_level: string
  status: string
  price: number
  downloads: number
  views: number
  rating: string | number
  cover_url: string
  source_type: string
  description: string
  links?: Array<{
    label: string
    type: string
    url: string
    previewUrl: string | null
    access: string
  }>
  tags?: string[]
  created_at: string
  updated_at: string
  saved_at?: string
  last_downloaded_at?: string
  download_count?: number | string
}

function normalizeStatus(status: string) {
  if (status === 'เผยแพร่') return 'เผยแพร่แล้ว'
  if (status === 'แบบร่าง') return 'ฉบับร่าง'
  if (status === 'ซ่อน') return 'ซ่อนชั่วคราว'
  return status
}

function toMedia(row: MediaRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    topic: row.topic,
    access: row.access_level,
    status: normalizeStatus(row.status),
    price: row.price,
    downloads: row.downloads,
    views: row.views,
    rating: Number(row.rating),
    cover: safeHttpUrl(row.cover_url),
    source: row.source_type,
    description: row.description,
    resourceUrl: row.links?.[0]?.url ?? '',
    previewUrl: row.links?.[0]?.previewUrl ?? '',
    links: row.links?.map((link) => ({
      label: link.label,
      type: link.type,
      url: link.url,
      previewUrl: link.previewUrl ?? '',
      access: link.access,
    })) ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function revealPurchasedLinks(media: ReturnType<typeof toMedia>) {
  const links = media.links.map((link) => ({
    ...link,
    url: safeHttpUrl(link.url),
    previewUrl: safeHttpUrl(link.previewUrl),
  }))
  const first = links.find((link) => link.url || link.previewUrl)
  return { ...media, resourceUrl: first?.url ?? '', previewUrl: first?.previewUrl ?? '', links }
}

function mediaSelect(prefix: string) {
  return `
    ${prefix}.*,
    link.links,
    tagset.tags
  `
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const currentUser = await getCurrentUser(env, request)
    if (!currentUser) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const sql = getSql(env)
    const [user] = await sql`
      select id, name, email, role, access_level, vip_expires_at, created_at
      from users
      where lower(email) = ${currentUser.email.toLowerCase()}
      limit 1
    `
    if (!user) {
      return Response.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const favorites = (await sql.query(
      `
        select ${mediaSelect('media')}, user_favorites.created_at as saved_at
        from user_favorites
        join media on media.id = user_favorites.media_id
        left join lateral (
          select jsonb_agg(
            jsonb_build_object(
              'label', label, 'type', type, 'url', url,
              'previewUrl', preview_url, 'access', access_level
            ) order by sort_order asc, id asc
          ) as links
          from media_links where media_links.media_id = media.id
        ) link on true
        left join lateral (
          select array_agg(tags.name order by tags.name asc) as tags
          from media_tags join tags on tags.id = media_tags.tag_id
          where media_tags.media_id = media.id
        ) tagset on true
        where user_favorites.user_id = $1 and media.deleted_at is null and media.status in ('เผยแพร่', 'เผยแพร่แล้ว')
        order by user_favorites.created_at desc
        limit 60
      `,
      [user.id],
    )) as MediaRow[]

    const history = (await sql.query(
      `
        select ${mediaSelect('media')},
          max(media_events.created_at) as last_downloaded_at,
          count(*)::int as download_count
        from media_events
        join media on media.id = media_events.media_id
        left join lateral (
          select jsonb_agg(
            jsonb_build_object(
              'label', label, 'type', type, 'url', url,
              'previewUrl', preview_url, 'access', access_level
            ) order by sort_order asc, id asc
          ) as links
          from media_links where media_links.media_id = media.id
        ) link on true
        left join lateral (
          select array_agg(tags.name order by tags.name asc) as tags
          from media_tags join tags on tags.id = media_tags.tag_id
          where media_tags.media_id = media.id
        ) tagset on true
        where lower(media_events.user_email) = $1 and media_events.event_type = 'download'
          and media.deleted_at is null and media.status in ('เผยแพร่', 'เผยแพร่แล้ว')
        group by media.id, link.links, tagset.tags
        order by last_downloaded_at desc
        limit 30
      `,
      [currentUser.email.toLowerCase()],
    )) as MediaRow[]

    const purchases = (await sql.query(
      `
        select ${mediaSelect('media')}, media_purchases.granted_at as purchased_at,
          media_purchases.amount as purchase_amount
        from media_purchases
        join media on media.id = media_purchases.media_id
        left join lateral (
          select jsonb_agg(
            jsonb_build_object(
              'label', label, 'type', type, 'url', url,
              'previewUrl', preview_url, 'access', access_level
            ) order by sort_order asc, id asc
          ) as links
          from media_links where media_links.media_id = media.id
        ) link on true
        left join lateral (
          select array_agg(tags.name order by tags.name asc) as tags
          from media_tags join tags on tags.id = media_tags.tag_id
          where media_tags.media_id = media.id
        ) tagset on true
        where media_purchases.user_id = $1 and media_purchases.status = 'active'
          and media.deleted_at is null and media.status in ('เผยแพร่', 'เผยแพร่แล้ว')
        order by media_purchases.granted_at desc
        limit 60
      `,
      [user.id],
    )) as Array<MediaRow & { purchased_at?: string; purchase_amount?: number | string }>

    const vipRequests = await sql`
      select id, phone, slip_name, slip_data_url, status, created_at, updated_at
      from vip_requests
      where user_id = ${user.id}
      order by created_at desc
      limit 100
    `
    const vipRequest = vipRequests[0]

    return Response.json({
      ok: true,
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        access: user.access_level,
        vipExpiresAt: user.vip_expires_at,
        createdAt: user.created_at,
      },
      favorites: favorites.map((row) => ({ media: hideProtectedLinks(toMedia(row), currentUser), savedAt: row.saved_at })),
      history: history.map((row) => ({
        media: hideProtectedLinks(toMedia(row), currentUser),
        lastDownloadedAt: row.last_downloaded_at,
        downloadCount: Number(row.download_count ?? 0),
      })),
      purchases: purchases.map((row) => ({
        media: revealPurchasedLinks(toMedia(row)),
        purchasedAt: row.purchased_at,
        amount: Number(row.purchase_amount ?? 0),
      })),
      vipRequest: vipRequest ? {
        id: vipRequest.id,
        phone: vipRequest.phone ?? '',
        slipName: vipRequest.slip_name ?? '',
        slipDataUrl: vipRequest.slip_data_url ?? '',
        status: vipRequest.status,
        createdAt: vipRequest.created_at,
        updatedAt: vipRequest.updated_at,
      } : null,
      vipRequests: vipRequests.map((request) => ({
        id: request.id,
        phone: request.phone ?? '',
        slipName: request.slip_name ?? '',
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      })),
    })
  } catch (error) {
    await writeErrorLog(env, 'member.library.read', error)
    return Response.json({ ok: false, error: 'โหลดคลังสมาชิกไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const currentUser = await getCurrentUser(env, request)
    if (!currentUser) {
      return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนบันทึกรายการโปรด' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as FavoritePayload
    const mediaId = Number(body.mediaId)
    if (!Number.isInteger(mediaId) || mediaId <= 0 || typeof body.favorite !== 'boolean') {
      return Response.json({ ok: false, error: 'ข้อมูลรายการโปรดไม่ถูกต้อง' }, { status: 400 })
    }

    const sql = getSql(env)
    const [user] = await sql`select id from users where lower(email) = ${currentUser.email.toLowerCase()} limit 1`
    const [media] = await sql`
      select id, title, access_level
      from media
      where id = ${mediaId} and deleted_at is null and status in ('เผยแพร่', 'เผยแพร่แล้ว')
      limit 1
    `
    if (!user || !media) {
      return Response.json({ ok: false, error: 'ไม่พบสมาชิกหรือสื่อที่ต้องการ' }, { status: 404 })
    }
    if (body.favorite && !canAccessLevel(currentUser, String(media.access_level)) && !(await hasPurchasedMedia(env, currentUser, mediaId))) {
      return Response.json({ ok: false, error: 'บัญชีนี้ยังไม่มีสิทธิ์บันทึกสื่อนี้' }, { status: 403 })
    }

    if (body.favorite) {
      await sql`
        insert into user_favorites (user_id, media_id)
        values (${user.id}, ${mediaId})
        on conflict do nothing
      `
    } else {
      await sql`delete from user_favorites where user_id = ${user.id} and media_id = ${mediaId}`
    }

    await writeAuditLog(
      env,
      currentUser,
      body.favorite ? 'favorite_add' : 'favorite_remove',
      'media',
      mediaId,
      { title: media.title },
    )
    return Response.json({ ok: true, favorite: body.favorite })
  } catch (error) {
    await writeErrorLog(env, 'member.library.favorite', error)
    return Response.json({ ok: false, error: 'บันทึกรายการโปรดไม่สำเร็จ' }, { status: 500 })
  }
}
