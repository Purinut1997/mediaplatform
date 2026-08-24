import { getCurrentUser } from '../_lib/auth'
import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { boundedText, InputValidationError, normalizedEmail } from '../_lib/input'
import { writeNotification } from '../_lib/notifications'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../_lib/rate-limit'

const ticketCategories = ['general', 'bug', 'account', 'payment', 'suggestion'] as const
const ticketStatuses = ['pending', 'reviewing', 'resolved', 'rejected'] as const
type TicketPayload = { name?: string; email?: string; category?: typeof ticketCategories[number]; subject?: string; detail?: string; pageUrl?: string; id?: number; status?: typeof ticketStatuses[number]; adminNote?: string }

const mapTicket = (row: Record<string, unknown>) => ({
  id: Number(row.id),
  name: String(row.name ?? ''),
  email: String(row.email ?? ''),
  category: row.category,
  subject: String(row.subject ?? ''),
  detail: String(row.detail ?? ''),
  pageUrl: String(row.page_url ?? ''),
  status: row.status,
  adminNote: String(row.admin_note ?? ''),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const admin = await requireAdminPermission(env, request, 'media:read')
  if (!admin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const sql = getSql(env)
  const rows = await sql`select * from support_tickets order by created_at desc limit 200`
  return Response.json({ ok: true, tickets: rows.map(mapTicket) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as TicketPayload
    const name = boundedText(body.name, 'ชื่อ', { min: 2, max: 80 })
    const email = normalizedEmail(body.email)
    const category = ticketCategories.includes(body.category as typeof ticketCategories[number]) ? body.category as typeof ticketCategories[number] : 'general'
    const subject = boundedText(body.subject, 'หัวข้อ', { min: 3, max: 120 })
    const detail = boundedText(body.detail, 'รายละเอียด', { min: 10, max: 1500 })
    const pageUrl = boundedText(body.pageUrl, 'หน้าที่แจ้ง', { max: 500 })
    const ip = requestIp(request)
    const limit = await enforceRateLimits(env, [
      { action: 'support-ticket:ip', identifier: ip, limit: 5, windowSeconds: 86400, blockSeconds: 86400 },
      { action: 'support-ticket:email', identifier: email, limit: 5, windowSeconds: 86400, blockSeconds: 86400 },
    ])
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
    const user = await getCurrentUser(env, request)
    const sql = getSql(env)
    let userId: number | null = null
    if (user) {
      const [dbUser] = await sql`select id from users where lower(email) = ${user.email.toLowerCase()} and status = 'active' limit 1`
      userId = dbUser ? Number(dbUser.id) : null
    }
    const [created] = await sql`
      insert into support_tickets (user_id, name, email, category, subject, detail, page_url)
      values (${userId}, ${name}, ${email}, ${category}, ${subject}, ${detail}, ${pageUrl})
      returning id, status, created_at, updated_at
    `
    if (user) {
      await writeAuditLog(env, user, 'create_support_ticket', 'support_ticket', created.id, { category, subject })
    }
    await writeNotification(env, { audience: 'superadmin', type: 'support_ticket_pending', title: 'มีเรื่องแจ้งปัญหาใหม่', detail: `${subject} · ${email}`, tone: 'amber', targetType: 'support_ticket', targetId: created.id, fingerprint: `support_ticket:${created.id}` })
    return Response.json({ ok: true, ticket: created }, { status: 201 })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'support.create', error)
    return Response.json({ ok: false, error: 'ส่งเรื่องแจ้งปัญหาไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  const admin = await requireAdminPermission(env, request, 'media:write')
  if (!admin) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as TicketPayload
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0 || !ticketStatuses.includes(body.status as typeof ticketStatuses[number])) return Response.json({ ok: false, error: 'ข้อมูลสถานะไม่ถูกต้อง' }, { status: 400 })
    const note = boundedText(body.adminNote, 'หมายเหตุผู้ดูแล', { max: 1000 })
    const sql = getSql(env)
    const [updated] = await sql`update support_tickets set status = ${body.status}, admin_note = ${note}, updated_at = now() where id = ${id} returning id, status`
    if (!updated) return Response.json({ ok: false, error: 'ไม่พบเรื่องแจ้งปัญหา' }, { status: 404 })
    await writeAuditLog(env, admin, 'set_support_ticket_status', 'support_ticket', id, { status: body.status, note })
    return Response.json({ ok: true, ticket: updated })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'support.update', error)
    return Response.json({ ok: false, error: 'อัปเดตเรื่องแจ้งปัญหาไม่สำเร็จ' }, { status: 500 })
  }
}
