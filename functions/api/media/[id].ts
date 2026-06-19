import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import {
  mediaAccess,
  mediaPrice,
  mediaStatus,
  mediaText,
} from '../../_lib/media-validation'
import { optionalHttpUrl } from '../../_lib/url'

const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

type MediaPayload = {
  title?: string
  topic?: string
  access?: string
  status?: string
  price?: number
  source?: string
  cover?: string
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
  description?: string
  availableFrom?: string
  availableUntil?: string
  downloadLimit?: number
}

type Context = {
  env: Env
  request: Request
  params: { id?: string }
}

async function requireSuperAdmin(env: Env, request: Request) {
  const currentUser = await requireAdminPermission(env, request, 'media:write')
  if (!currentUser) {
    return { ok: false as const, response: Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, actor: currentUser.email }
}

function readId(params: Context['params']) {
  const id = Number(params.id)
  return Number.isInteger(id) && id > 0 ? id : 0
}

function readLinks(body: MediaPayload, title: string) {
  const links = Array.isArray(body.links) ? body.links : []
  if (links.length > 20) throw new Error('สื่อหนึ่งรายการเพิ่มลิงก์ได้สูงสุด 20 ลิงก์')
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

function readMediaFields(body: MediaPayload) {
  const availableFrom = body.availableFrom ? new Date(body.availableFrom) : null
  const availableUntil = body.availableUntil ? new Date(body.availableUntil) : null
  const maxDownloads = Number(body.downloadLimit ?? 0)
  if (availableFrom && Number.isNaN(availableFrom.getTime())) throw new Error('วันเริ่มเผยแพร่ไม่ถูกต้อง')
  if (availableUntil && Number.isNaN(availableUntil.getTime())) throw new Error('วันสิ้นสุดเผยแพร่ไม่ถูกต้อง')
  if (availableFrom && availableUntil && availableFrom >= availableUntil) throw new Error('วันสิ้นสุดต้องอยู่หลังวันเริ่มเผยแพร่')
  if (!Number.isInteger(maxDownloads) || maxDownloads < 0 || maxDownloads > 1_000_000) throw new Error('จำนวนดาวน์โหลดสูงสุดไม่ถูกต้อง')
  return {
    title: mediaText(body.title, 'ชื่อสื่อ', 200),
    description: mediaText(body.description, 'รายละเอียดสื่อ', 10_000),
    topic: mediaText(body.topic, 'หมวดหมู่', 100, 'โรงเรียน') || 'โรงเรียน',
    access: mediaAccess(body.access),
    status: mediaStatus(body.status),
    price: mediaPrice(body.price),
    source: mediaText(body.source, 'ชนิดสื่อ', 80, 'Google Drive') || 'Google Drive',
    availableFrom: availableFrom?.toISOString() ?? null,
    availableUntil: availableUntil?.toISOString() ?? null,
    maxDownloads,
  }
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

export const onRequestPut = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as MediaPayload
  let fields: ReturnType<typeof readMediaFields>
  try {
    fields = readMediaFields(body)
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'ข้อมูลสื่อไม่ถูกต้อง' },
      { status: 400 },
    )
  }
  const { title, description, topic, access, status, price, source, availableFrom, availableUntil, maxDownloads } = fields
  if (!title) {
    return Response.json({ ok: false, error: 'กรุณากรอกชื่อสื่อไม่เกิน 200 ตัวอักษร' }, { status: 400 })
  }
  let links: ReturnType<typeof readLinks>
  let coverUrl: string
  try {
    links = readLinks(body, title)
    coverUrl = optionalHttpUrl(body.cover, 'ลิงก์ภาพหน้าปก') || DEFAULT_COVER_URL
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'ข้อมูลลิงก์ไม่ถูกต้อง' },
      { status: 400 },
    )
  }

  const tags = readTags(body)
  const [existing] = await sql`select id from media where id = ${id} and deleted_at is null limit 1`
  if (!existing) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql.transaction((tx) => [
    tx`
      update media
      set title = ${title}, topic = ${topic}, access_level = ${access}, status = ${status},
        price = ${price}, cover_url = ${coverUrl}, source_type = ${source},
        description = ${description}, available_from = ${availableFrom}, available_until = ${availableUntil},
        download_limit = ${maxDownloads}, updated_at = now()
      where id = ${id} and deleted_at is null
    `,
    tx`delete from media_links where media_id = ${id}`,
    ...links.map((link, index) => tx`
      insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
      values (${id}, ${link.label}, ${link.type}, ${link.url}, ${link.previewUrl || null}, ${link.access}, ${index})
    `),
    tx`delete from media_tags where media_id = ${id}`,
    ...tags.flatMap((name) => [
      tx`
        insert into tags (name, slug)
        values (${name}, ${tagSlug(name)})
        on conflict (name) do update set name = excluded.name
      `,
      tx`
        insert into media_tags (media_id, tag_id)
        select ${id}, tags.id from tags where tags.name = ${name}
        on conflict do nothing
      `,
    ]),
    tx`
      insert into audit_logs (actor, action, target_type, target_id, detail)
      values (${auth.actor}, 'update', 'media', ${String(id)}, ${JSON.stringify({ title, tags })}::jsonb)
    `,
  ])

  return Response.json({ ok: true })
}

export const onRequestDelete = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const [row] = await sql`
    update media set deleted_at = now(), deleted_by = ${auth.actor}, updated_at = now()
    where id = ${id} and deleted_at is null returning title
  `
  if (!row) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${auth.actor}, 'trash', 'media', ${String(id)}, ${JSON.stringify({ title: row.title })}::jsonb)
  `

  return Response.json({ ok: true })
}
