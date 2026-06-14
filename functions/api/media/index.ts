import { getCurrentUser } from '../../_lib/auth'
import { requireAdminPermission, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { hideProtectedLinks } from '../../_lib/media-access'
import {
  mediaAccess,
  mediaPrice,
  mediaStatus,
  mediaText,
  MEDIA_ACCESS_LEVELS,
  MEDIA_STATUSES,
  MediaValidationError,
} from '../../_lib/media-validation'
import { optionalHttpUrl, safeHttpUrl, UrlValidationError } from '../../_lib/url'
import { readPagination } from '../../_lib/pagination'

const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

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
  resource_url?: string | null
  preview_url?: string | null
  links?: Array<{
    id?: number
    label: string
    type: string
    url: string
    previewUrl: string | null
    access: string
  }>
  tags?: string[]
  created_at: string
  updated_at: string
}

type MediaPayload = Partial<ReturnType<typeof toMedia>> & {
  resourceUrl?: string
  previewUrl?: string
  links?: Array<{
    label?: string
    type?: string
    url?: string
    previewUrl?: string
    access?: string
  }>
  tags?: string[] | string
}

function normalizeStatus(status: string) {
  if (status === 'เผยแพร่') return 'เผยแพร่แล้ว'
  if (status === 'แบบร่าง') return 'ฉบับร่าง'
  if (status === 'ซ่อน') return 'ซ่อนชั่วคราว'
  return status
}

function readLinks(body: MediaPayload, title: string) {
  const links = Array.isArray(body.links) ? body.links : []
  if (links.length > 20) throw new UrlValidationError('สื่อหนึ่งรายการเพิ่มลิงก์ได้สูงสุด 20 ลิงก์')
  const normalized = links
    .map((link, index) => ({
      label: mediaText(link.label, `ชื่อปุ่มลิงก์รายการที่ ${index + 1}`, 120) || `ลิงก์ ${index + 1}`,
      type: mediaText(link.type, `ชนิดลิงก์รายการที่ ${index + 1}`, 80, String(body.source ?? 'Google Drive')),
      url: optionalHttpUrl(link.url, `ลิงก์รายการที่ ${index + 1}`),
      previewUrl: optionalHttpUrl(link.previewUrl, `ลิงก์ตัวอย่างรายการที่ ${index + 1}`),
      access: mediaAccess(link.access, mediaAccess(body.access)),
    }))
    .filter((link) => link.url)

  const resourceUrl = optionalHttpUrl(body.resourceUrl, 'ลิงก์ไฟล์หลัก')
  if (!normalized.length && resourceUrl) {
    normalized.push({
      label: title,
      type: mediaText(body.source, 'ชนิดลิงก์ไฟล์หลัก', 80, 'Google Drive') || 'Google Drive',
      url: resourceUrl,
      previewUrl: optionalHttpUrl(body.previewUrl, 'ลิงก์ตัวอย่าง'),
      access: mediaAccess(body.access),
    })
  }

  return normalized
}

function readTags(body: MediaPayload) {
  const raw = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags ?? '')
        .split(',')
  return Array.from(new Set(raw.map((tag) => mediaText(tag, 'ชื่อแท็ก', 60)).filter(Boolean))).slice(0, 12)
}

function tagSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'tag'
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return `${base}-${hash.toString(36)}`
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
    cover: safeHttpUrl(row.cover_url, DEFAULT_COVER_URL),
    source: row.source_type,
    description: row.description,
    resourceUrl: safeHttpUrl(row.resource_url),
    previewUrl: safeHttpUrl(row.preview_url),
    links: Array.isArray(row.links)
      ? row.links.map((link) => ({
          id: link.id,
          label: link.label,
          type: link.type,
          url: safeHttpUrl(link.url),
          previewUrl: safeHttpUrl(link.previewUrl),
          access: link.access,
        }))
      : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const url = new URL(request.url)
  const topic = url.searchParams.get('topic')
  const query = url.searchParams.get('query')?.trim().slice(0, 120) ?? ''
  const pattern = `%${query}%`
  const adminUser = await requireAdminPermission(env, request, 'media:read')
  const canReadAll = Boolean(adminUser)
  const currentUser = adminUser ?? await getCurrentUser(env, request)
  const requestedAccess = url.searchParams.get('access')?.trim() ?? ''
  const access = canReadAll && MEDIA_ACCESS_LEVELS.includes(requestedAccess as (typeof MEDIA_ACCESS_LEVELS)[number])
    ? requestedAccess
    : ''
  const tag = canReadAll ? url.searchParams.get('tag')?.trim().slice(0, 60) ?? '' : ''
  const tagPattern = `%${tag}%`
  const requestedDays = Number(url.searchParams.get('days') ?? 0)
  const days = canReadAll && Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(Math.trunc(requestedDays), 365) : 0
  const sort = canReadAll && ['downloads', 'views', 'title'].includes(url.searchParams.get('sort') ?? '')
    ? url.searchParams.get('sort')
    : 'latest'
  const requestedStatus = url.searchParams.get('status')
  const { page, pageSize, offset } = readPagination(url, { defaultPageSize: 40 })
  const status =
    canReadAll && requestedStatus === 'all'
      ? 'all'
      : canReadAll && requestedStatus && MEDIA_STATUSES.includes(requestedStatus as (typeof MEDIA_STATUSES)[number])
        ? requestedStatus
        : 'เผยแพร่แล้ว'
  const isAllStatus = status === 'all'
  const statusList = status === 'เผยแพร่แล้ว' ? ['เผยแพร่แล้ว', 'เผยแพร่'] : [status]

  const rows =
    topic && topic !== 'ทั้งหมด'
      ? await sql`
          select media.*, link.url as resource_url, link.preview_url, link.links, tagset.tags
          from media
          left join lateral (
            select
              (array_agg(url order by sort_order asc, id asc))[1] as url,
              (array_agg(preview_url order by sort_order asc, id asc))[1] as preview_url,
              jsonb_agg(
                jsonb_build_object(
                  'label', label,
                  'id', id,
                  'type', type,
                  'url', url,
                  'previewUrl', preview_url,
                  'access', access_level
                )
                order by sort_order asc, id asc
              ) as links
            from media_links
            where media_links.media_id = media.id
          ) link on true
          left join lateral (
            select array_agg(tags.name order by tags.name asc) as tags
            from media_tags
            join tags on tags.id = media_tags.tag_id
            where media_tags.media_id = media.id
          ) tagset on true
          where (${isAllStatus} or media.status = any(${statusList}))
            and media.topic = ${topic}
            and (${access} = '' or media.access_level = ${access})
            and (${days} = 0 or media.created_at >= now() - make_interval(days => ${days}))
            and (${query} = '' or media.title ilike ${pattern} or media.topic ilike ${pattern} or media.description ilike ${pattern}
              or exists (select 1 from media_links where media_links.media_id = media.id and (label ilike ${pattern} or type ilike ${pattern} or url ilike ${pattern}))
              or exists (select 1 from media_tags join tags on tags.id = media_tags.tag_id where media_tags.media_id = media.id and tags.name ilike ${pattern}))
            and (${tag} = '' or exists (
              select 1 from media_tags join tags on tags.id = media_tags.tag_id
              where media_tags.media_id = media.id and tags.name ilike ${tagPattern}
            ))
          order by
            case when ${sort} = 'downloads' then media.downloads end desc,
            case when ${sort} = 'views' then media.views end desc,
            case when ${sort} = 'title' then media.title end asc,
            media.updated_at desc, media.id desc
          limit ${pageSize} offset ${offset}
        `
      : await sql`
          select media.*, link.url as resource_url, link.preview_url, link.links, tagset.tags
          from media
          left join lateral (
            select
              (array_agg(url order by sort_order asc, id asc))[1] as url,
              (array_agg(preview_url order by sort_order asc, id asc))[1] as preview_url,
              jsonb_agg(
                jsonb_build_object(
                  'label', label,
                  'id', id,
                  'type', type,
                  'url', url,
                  'previewUrl', preview_url,
                  'access', access_level
                )
                order by sort_order asc, id asc
              ) as links
            from media_links
            where media_links.media_id = media.id
          ) link on true
          left join lateral (
            select array_agg(tags.name order by tags.name asc) as tags
            from media_tags
            join tags on tags.id = media_tags.tag_id
            where media_tags.media_id = media.id
          ) tagset on true
          where (${isAllStatus} or media.status = any(${statusList}))
            and (${access} = '' or media.access_level = ${access})
            and (${days} = 0 or media.created_at >= now() - make_interval(days => ${days}))
            and (${query} = '' or media.title ilike ${pattern} or media.topic ilike ${pattern} or media.description ilike ${pattern}
              or exists (select 1 from media_links where media_links.media_id = media.id and (label ilike ${pattern} or type ilike ${pattern} or url ilike ${pattern}))
              or exists (select 1 from media_tags join tags on tags.id = media_tags.tag_id where media_tags.media_id = media.id and tags.name ilike ${pattern}))
            and (${tag} = '' or exists (
              select 1 from media_tags join tags on tags.id = media_tags.tag_id
              where media_tags.media_id = media.id and tags.name ilike ${tagPattern}
            ))
          order by
            case when ${sort} = 'downloads' then media.downloads end desc,
            case when ${sort} = 'views' then media.views end desc,
            case when ${sort} = 'title' then media.title end asc,
            media.updated_at desc, media.id desc
          limit ${pageSize} offset ${offset}
        `
  const [countRow] = topic && topic !== 'ทั้งหมด'
    ? await sql`
        select count(*)::int as total from media
        where (${isAllStatus} or status = any(${statusList})) and topic = ${topic}
          and (${access} = '' or access_level = ${access})
          and (${days} = 0 or created_at >= now() - make_interval(days => ${days}))
          and (${query} = '' or title ilike ${pattern} or topic ilike ${pattern} or description ilike ${pattern}
            or exists (select 1 from media_links where media_links.media_id = media.id and (label ilike ${pattern} or type ilike ${pattern} or url ilike ${pattern}))
            or exists (select 1 from media_tags join tags on tags.id = media_tags.tag_id where media_tags.media_id = media.id and tags.name ilike ${pattern}))
          and (${tag} = '' or exists (
            select 1 from media_tags join tags on tags.id = media_tags.tag_id
            where media_tags.media_id = media.id and tags.name ilike ${tagPattern}
          ))
      `
    : await sql`
        select count(*)::int as total from media
        where (${isAllStatus} or status = any(${statusList}))
          and (${access} = '' or access_level = ${access})
          and (${days} = 0 or created_at >= now() - make_interval(days => ${days}))
          and (${query} = '' or title ilike ${pattern} or topic ilike ${pattern} or description ilike ${pattern}
            or exists (select 1 from media_links where media_links.media_id = media.id and (label ilike ${pattern} or type ilike ${pattern} or url ilike ${pattern}))
            or exists (select 1 from media_tags join tags on tags.id = media_tags.tag_id where media_tags.media_id = media.id and tags.name ilike ${pattern}))
          and (${tag} = '' or exists (
            select 1 from media_tags join tags on tags.id = media_tags.tag_id
            where media_tags.media_id = media.id and tags.name ilike ${tagPattern}
          ))
      `

  return Response.json({
    ok: true,
    page,
    pageSize,
    total: Number(countRow?.total ?? 0),
    hasMore: offset + rows.length < Number(countRow?.total ?? 0),
    media: (rows as MediaRow[]).map((row) => {
      const media = toMedia(row)
      return canReadAll ? media : hideProtectedLinks(media, currentUser)
    }),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    const currentUser = await getCurrentUser(env, request)
    const hasToken =
      Boolean(env.ADMIN_WRITE_TOKEN) &&
      request.headers.get('x-admin-token') === env.ADMIN_WRITE_TOKEN
    const canWrite = currentUser?.role === 'superadmin' || currentUser?.role === 'admin'

    if (!canWrite && !hasToken) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    await ensureSchema(env)
    const sql = getSql(env)
    const body = (await request.json()) as MediaPayload
    const title = mediaText(body.title, 'ชื่อสื่อ', 200)

    if (!title) {
      return Response.json({ ok: false, error: 'กรุณากรอกชื่อสื่อไม่เกิน 200 ตัวอักษร' }, { status: 400 })
    }
    const description = mediaText(body.description, 'รายละเอียดสื่อ', 10_000)
    const topic = mediaText(body.topic, 'หมวดหมู่', 100, 'โรงเรียน') || 'โรงเรียน'
    const access = mediaAccess(body.access)
    const status = mediaStatus(body.status)
    const price = mediaPrice(body.price)
    const source = mediaText(body.source, 'ชนิดสื่อ', 80, 'Google Drive') || 'Google Drive'

    const slugBase =
      String(body.slug || title)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-')
        .replace(/^-|-$/g, '') || 'media'
    const slug = `${slugBase}-${Date.now()}`
    const coverUrl = optionalHttpUrl(body.cover, 'ลิงก์ภาพหน้าปก') || DEFAULT_COVER_URL
    const links = readLinks(body, title)
    const tags = readTags(body)

    await sql.transaction((tx) => [
      tx`
        insert into media (
          title, slug, topic, access_level, status, price, cover_url, source_type, description
        )
        values (${title}, ${slug}, ${topic}, ${access}, ${status}, ${price}, ${coverUrl}, ${source}, ${description})
      `,
      ...links.map((link, index) => tx`
        insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
        select id, ${link.label}, ${link.type}, ${link.url}, ${link.previewUrl || null}, ${link.access}, ${index}
        from media where slug = ${slug}
      `),
      ...tags.flatMap((name) => [
        tx`
          insert into tags (name, slug)
          values (${name}, ${tagSlug(name)})
          on conflict (name) do update set name = excluded.name
        `,
        tx`
          insert into media_tags (media_id, tag_id)
          select media.id, tags.id from media cross join tags
          where media.slug = ${slug} and tags.name = ${name}
          on conflict do nothing
        `,
      ]),
      tx`
        insert into audit_logs (actor, action, target_type, target_id, detail)
        values (${currentUser?.email ?? 'token-superadmin'}, 'create', 'media', ${slug}, ${JSON.stringify({ title, tags })}::jsonb)
      `,
    ])
    const [row] = (await sql`select * from media where slug = ${slug} limit 1`) as MediaRow[]
    if (!row) throw new Error('Created media could not be loaded')

    return Response.json({ ok: true, media: { ...toMedia(row), tags } }, { status: 201 })
  } catch (error) {
    if (error instanceof UrlValidationError || error instanceof MediaValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    console.error('Create media failed', error)
    await writeErrorLog(env, 'media.create', error)
    return Response.json(
      {
        ok: false,
        error: 'บันทึกข้อมูลไม่สำเร็จ',
      },
      { status: 500 },
    )
  }
}
