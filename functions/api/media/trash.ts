import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

type TrashPayload = { id?: number; action?: 'restore' | 'purge' }

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const user = await requireAdminPermission(env, request, 'media:write')
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as TrashPayload
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0 || !['restore', 'purge'].includes(String(body.action))) {
    return Response.json({ ok: false, error: 'ข้อมูลคำสั่งถังขยะไม่ถูกต้อง' }, { status: 400 })
  }
  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const [row] = body.action === 'purge'
      ? await sql`delete from media where id = ${id} and deleted_at is not null returning id, title`
      : await sql`
          update media set deleted_at = null, deleted_by = null, updated_at = now()
          where id = ${id} and deleted_at is not null returning id, title
        `
    if (!row) return Response.json({ ok: false, error: 'ไม่พบสื่อในถังขยะ' }, { status: 404 })
    await writeAuditLog(env, user, body.action === 'purge' ? 'purge' : 'restore', 'media', id, { title: row.title })
    return Response.json({ ok: true, media: row })
  } catch (error) {
    await writeErrorLog(env, 'media.trash', error, { id, action: body.action })
    return Response.json({ ok: false, error: 'จัดการถังขยะไม่สำเร็จ' }, { status: 500 })
  }
}
