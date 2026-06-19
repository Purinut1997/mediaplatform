import { getCurrentUser } from '../../_lib/auth'
import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { boundedText, InputValidationError } from '../../_lib/input'
import { writeNotification } from '../../_lib/notifications'
import { enforceRateLimits, rateLimitResponse } from '../../_lib/rate-limit'

const issueTypes = ['broken_link', 'incorrect_content', 'copyright', 'other'] as const
const issueStatuses = ['pending', 'reviewing', 'resolved', 'rejected'] as const
type IssuePayload = { mediaId?: number; issueType?: typeof issueTypes[number]; detail?: string; contact?: string; id?: number; status?: typeof issueStatuses[number]; adminNote?: string }

const mapIssue = (row: Record<string, unknown>) => ({ id: Number(row.id), mediaId: Number(row.media_id), mediaTitle: String(row.media_title ?? ''), name: String(row.name ?? ''), email: String(row.email ?? ''), issueType: row.issue_type, detail: String(row.detail ?? ''), contact: String(row.contact ?? ''), status: row.status, adminNote: String(row.admin_note ?? ''), createdAt: row.created_at, updatedAt: row.updated_at })

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const user = await getCurrentUser(env, request)
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const sql = getSql(env)
  const isAdmin = Boolean(await requireAdminPermission(env, request, 'media:read'))
  const rows = isAdmin ? await sql`
    select reports.*, media.title as media_title, users.name, users.email from media_issue_reports reports
    join media on media.id = reports.media_id join users on users.id = reports.user_id order by reports.created_at desc limit 200
  ` : await sql`
    select reports.*, media.title as media_title, users.name, users.email from media_issue_reports reports
    join media on media.id = reports.media_id join users on users.id = reports.user_id
    where lower(users.email) = ${user.email.toLowerCase()} order by reports.created_at desc limit 100
  `
  return Response.json({ ok: true, issues: rows.map(mapIssue) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const user = await getCurrentUser(env, request)
  if (!user) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนแจ้งปัญหา' }, { status: 401 })
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as IssuePayload
    const mediaId = Number(body.mediaId)
    if (!Number.isInteger(mediaId) || mediaId <= 0 || !issueTypes.includes(body.issueType as typeof issueTypes[number])) return Response.json({ ok: false, error: 'ข้อมูลสื่อหรือประเภทปัญหาไม่ถูกต้อง' }, { status: 400 })
    const detail = boundedText(body.detail, 'รายละเอียดปัญหา', { min: 10, max: 1500 })
    const contact = boundedText(body.contact, 'ช่องทางติดต่อกลับ', { max: 160 })
    const limit = await enforceRateLimits(env, [{ action: 'media-issue:account', identifier: user.email, limit: 10, windowSeconds: 86400, blockSeconds: 86400 }])
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
    const sql = getSql(env)
    const [dbUser] = await sql`select id from users where lower(email) = ${user.email.toLowerCase()} and status = 'active' limit 1`
    const [media] = await sql`select id, title from media where id = ${mediaId} and deleted_at is null limit 1`
    if (!dbUser || !media) return Response.json({ ok: false, error: 'ไม่พบบัญชีหรือสื่อที่ต้องการแจ้ง' }, { status: 404 })
    const [active] = await sql`select id from media_issue_reports where user_id = ${dbUser.id} and media_id = ${mediaId} and status in ('pending', 'reviewing') limit 1`
    if (active) return Response.json({ ok: false, error: 'มีรายการแจ้งปัญหาสื่อนี้ที่กำลังดำเนินการอยู่แล้ว' }, { status: 409 })
    const [created] = await sql`insert into media_issue_reports (media_id, user_id, issue_type, detail, contact) values (${mediaId}, ${dbUser.id}, ${body.issueType}, ${detail}, ${contact}) returning id, status, created_at, updated_at`
    await writeAuditLog(env, user, 'report_media_issue', 'media_issue', created.id, { mediaId, issueType: body.issueType })
    await writeNotification(env, { audience: 'all', type: 'media_issue_pending', title: 'มีรายงานปัญหาสื่อใหม่', detail: `${media.title} · ${user.email}`, tone: 'amber', targetType: 'media_issue', targetId: created.id, fingerprint: `media_issue:${created.id}` })
    return Response.json({ ok: true, issue: created }, { status: 201 })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'media.issues.create', error, { email: user.email })
    return Response.json({ ok: false, error: 'ส่งรายงานปัญหาไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  const admin = await requireAdminPermission(env, request, 'media:write')
  if (!admin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as IssuePayload
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0 || !issueStatuses.includes(body.status as typeof issueStatuses[number])) return Response.json({ ok: false, error: 'ข้อมูลสถานะไม่ถูกต้อง' }, { status: 400 })
    const note = boundedText(body.adminNote, 'หมายเหตุผู้ดูแล', { max: 1000 })
    const sql = getSql(env)
    const [updated] = await sql`update media_issue_reports set status = ${body.status}, admin_note = ${note}, updated_at = now() where id = ${id} returning id, status`
    if (!updated) return Response.json({ ok: false, error: 'ไม่พบรายการแจ้งปัญหา' }, { status: 404 })
    await writeAuditLog(env, admin, 'set_media_issue_status', 'media_issue', id, { status: body.status, note })
    return Response.json({ ok: true, issue: updated })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'media.issues.update', error)
    return Response.json({ ok: false, error: 'อัปเดตรายงานปัญหาไม่สำเร็จ' }, { status: 500 })
  }
}
