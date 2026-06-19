import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { readMediaBulkCommand } from '../../_lib/media-bulk'

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const user = await requireAdminPermission(env, request, 'media:write')
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let command: ReturnType<typeof readMediaBulkCommand>
  try {
    command = readMediaBulkCommand(await request.json().catch(() => null))
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'ข้อมูลคำสั่งไม่ถูกต้อง' },
      { status: 400 },
    )
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const rows =
      command.action === 'delete'
        ? await sql`
            update media set deleted_at = now(), deleted_by = ${user.email}, updated_at = now()
            where id = any(${command.ids}) and deleted_at is null returning id, title
          `
        : command.action === 'status'
          ? await sql`
              update media set status = ${command.value}, updated_at = now()
              where id = any(${command.ids}) and deleted_at is null returning id, title
            `
          : await sql`
              update media set topic = ${command.value}, updated_at = now()
              where id = any(${command.ids}) and deleted_at is null returning id, title
            `

    await writeAuditLog(env, user, `bulk_${command.action}`, 'media', null, {
      ids: rows.map((row) => row.id),
      count: rows.length,
      value: command.value,
    })

    return Response.json({ ok: true, updated: rows.length })
  } catch (error) {
    await writeErrorLog(env, 'media.bulk', error, { action: command.action, count: command.ids.length })
    return Response.json({ ok: false, error: 'จัดการสื่อหลายรายการไม่สำเร็จ' }, { status: 500 })
  }
}
