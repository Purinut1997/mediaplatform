import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { hideProtectedLinks } from '../../_lib/media-access'

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
    cover: row.cover_url,
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
      select id, name, email, role, access_level, created_at
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
        where user_favorites.user_id = $1
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
        group by media.id, link.links, tagset.tags
        order by last_downloaded_at desc
        limit 30
      `,
      [currentUser.email.toLowerCase()],
    )) as MediaRow[]

    return Response.json({
      ok: true,
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        access: user.access_level,
        createdAt: user.created_at,
      },
      favorites: favorites.map((row) => ({ media: hideProtectedLinks(toMedia(row), currentUser), savedAt: row.saved_at })),
      history: history.map((row) => ({
        media: hideProtectedLinks(toMedia(row), currentUser),
        lastDownloadedAt: row.last_downloaded_at,
        downloadCount: Number(row.download_count ?? 0),
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
    const [media] = await sql`select id, title from media where id = ${mediaId} limit 1`
    if (!user || !media) {
      return Response.json({ ok: false, error: 'ไม่พบสมาชิกหรือสื่อที่ต้องการ' }, { status: 404 })
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
