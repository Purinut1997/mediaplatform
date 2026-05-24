import { getCurrentUser } from '../../_lib/auth'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

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
  description?: string
}

type Context = {
  env: Env
  request: Request
  params: { id?: string }
}

async function requireSuperAdmin(env: Env, request: Request) {
  const currentUser = await getCurrentUser(env, request)
  if (currentUser?.role !== 'superadmin') {
    return { ok: false as const, response: Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, actor: currentUser.email }
}

function readId(params: Context['params']) {
  const id = Number(params.id)
  return Number.isInteger(id) && id > 0 ? id : 0
}

export const onRequestPut = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as MediaPayload
  const title = String(body.title ?? '').trim()
  if (!title) return Response.json({ ok: false, error: 'title is required' }, { status: 400 })

  const [row] = await sql`
    update media
    set
      title = ${title},
      topic = ${body.topic ?? 'โรงเรียน'},
      access_level = ${body.access ?? 'สาธารณะ'},
      status = ${body.status ?? 'แบบร่าง'},
      price = ${Number(body.price ?? 0)},
      cover_url = ${String(body.cover ?? '').trim() || DEFAULT_COVER_URL},
      source_type = ${body.source ?? 'Google Drive'},
      description = ${body.description ?? ''},
      updated_at = now()
    where id = ${id}
    returning id
  `
  if (!row) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql`delete from media_links where media_id = ${id}`
  const resourceUrl = String(body.resourceUrl ?? '').trim()
  if (resourceUrl) {
    await sql`
      insert into media_links (media_id, label, type, url, preview_url, access_level)
      values (
        ${id},
        ${title},
        ${body.source ?? 'Google Drive'},
        ${resourceUrl},
        ${String(body.previewUrl ?? '').trim() || null},
        ${body.access ?? 'สาธารณะ'}
      )
    `
  }

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${auth.actor}, 'update', 'media', ${String(id)}, ${JSON.stringify({ title })}::jsonb)
  `

  return Response.json({ ok: true })
}

export const onRequestDelete = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const [row] = await sql`delete from media where id = ${id} returning title`
  if (!row) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${auth.actor}, 'delete', 'media', ${String(id)}, ${JSON.stringify({ title: row.title })}::jsonb)
  `

  return Response.json({ ok: true })
}
