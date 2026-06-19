import { getCurrentUser } from '../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { boundedText, InputValidationError } from '../_lib/input'
import { writeNotification } from '../_lib/notifications'
import { enforceRateLimits, rateLimitResponse } from '../_lib/rate-limit'

type RefundPayload = { requestType?: 'vip' | 'media'; referenceText?: string; reason?: string; detail?: string; contact?: string }

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const sql = getSql(env)
  const rows = await sql`
    select refund_requests.* from refund_requests
    join users on users.id = refund_requests.user_id
    where lower(users.email) = ${currentUser.email.toLowerCase()}
    order by refund_requests.created_at desc limit 100
  `
  return Response.json({ ok: true, requests: rows.map((row) => ({ id: row.id, requestType: row.request_type, referenceText: row.reference_text, reason: row.reason, detail: row.detail, contact: row.contact, status: row.status, adminNote: row.admin_note, createdAt: row.created_at, updatedAt: row.updated_at })) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนขอคืนเงิน' }, { status: 401 })
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as RefundPayload
    const requestType = body.requestType === 'media' ? 'media' : 'vip'
    const referenceText = boundedText(body.referenceText, 'รายการอ้างอิง', { min: 2, max: 200 })
    const reason = boundedText(body.reason, 'เหตุผล', { min: 3, max: 300 })
    const detail = boundedText(body.detail, 'รายละเอียด', { max: 1500 })
    const contact = boundedText(body.contact, 'ช่องทางติดต่อกลับ', { min: 3, max: 160 })
    const limit = await enforceRateLimits(env, [{ action: 'refund-request:account', identifier: currentUser.email, limit: 5, windowSeconds: 86400, blockSeconds: 86400 }])
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
    const sql = getSql(env)
    const [user] = await sql`select id from users where lower(email) = ${currentUser.email.toLowerCase()} and status = 'active' limit 1`
    if (!user) return Response.json({ ok: false, error: 'ไม่พบบัญชีสมาชิกที่ใช้งานอยู่' }, { status: 404 })
    const [pending] = await sql`select id from refund_requests where user_id = ${user.id} and status in ('pending', 'reviewing') limit 1`
    if (pending) return Response.json({ ok: false, error: 'มีคำขอคืนเงินที่กำลังดำเนินการอยู่แล้ว' }, { status: 409 })
    const [created] = await sql`insert into refund_requests (user_id, request_type, reference_text, reason, detail, contact) values (${user.id}, ${requestType}, ${referenceText}, ${reason}, ${detail}, ${contact}) returning id, status, created_at, updated_at`
    await writeAuditLog(env, currentUser, 'request_refund', 'refund_request', created.id, { requestType, referenceText })
    await writeNotification(env, { audience: 'superadmin', type: 'refund_pending', title: 'มีคำขอคืนเงินใหม่', detail: `${currentUser.email} · ${referenceText}`, tone: 'amber', targetType: 'refund_request', targetId: created.id, fingerprint: `refund:${created.id}` })
    return Response.json({ ok: true, request: created }, { status: 201 })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'refunds.create', error, { email: currentUser.email })
    return Response.json({ ok: false, error: 'ส่งคำขอคืนเงินไม่สำเร็จ' }, { status: 500 })
  }
}
