import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { boundedText, InputValidationError } from '../../_lib/input'
import { notifyTelegram } from '../../_lib/notify'
import { writeNotification } from '../../_lib/notifications'
import { paymentProofDataUrl } from '../../_lib/payment-proof'
import { enforceRateLimits, rateLimitResponse } from '../../_lib/rate-limit'

type VipRequestPayload = {
  phone?: string
  slipName?: string
  slipDataUrl?: string
  agreementAccepted?: boolean
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนสมัคร VIP' }, { status: 401 })
  if (currentUser.role !== 'member') return Response.json({ ok: false, error: 'บัญชีผู้ดูแลไม่ต้องส่งคำขอ VIP' }, { status: 403 })
  if (currentUser.access === 'VIP') return Response.json({ ok: false, error: 'บัญชีนี้เป็นสมาชิก VIP อยู่แล้ว' }, { status: 409 })

  const rateLimit = await enforceRateLimits(env, [{
    action: 'member:vip-request',
    identifier: currentUser.email.toLowerCase(),
    limit: 4,
    windowSeconds: 86400,
    blockSeconds: 86400,
  }])
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)

  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as VipRequestPayload
    const phone = boundedText(body.phone, 'เบอร์โทรศัพท์', { max: 30 })
    const slipName = boundedText(body.slipName, 'ชื่อไฟล์สลิป', { max: 200 })
    const slipDataUrl = paymentProofDataUrl(body.slipDataUrl)
    if (!body.agreementAccepted) {
      return Response.json({ ok: false, error: 'กรุณายอมรับเงื่อนไขก่อนส่งคำขอ VIP' }, { status: 400 })
    }

    const sql = getSql(env)
    const [settings] = await sql`
      select
        coalesce((value->>'vipRegistrationEnabled')::boolean, false) as enabled
      from app_settings where key = 'site' limit 1
    `
    if (!settings?.enabled) return Response.json({ ok: false, error: 'ขณะนี้ระบบยังไม่เปิดรับสมัคร VIP' }, { status: 403 })
    if (!slipName || !slipDataUrl) {
      return Response.json({ ok: false, error: 'กรุณาแนบสลิปการชำระเงินก่อนส่งคำขอ' }, { status: 400 })
    }

    const [user] = await sql`
      select id, name, email
      from users
      where lower(email) = ${currentUser.email.toLowerCase()} and status = 'active'
      limit 1
    `
    if (!user) return Response.json({ ok: false, error: 'ไม่พบบัญชีสมาชิกที่ใช้งานอยู่' }, { status: 404 })

    const [pending] = await sql`
      select id from vip_requests where user_id = ${user.id} and status = 'pending' limit 1
    `
    if (pending) return Response.json({ ok: false, error: 'คุณมีคำขอ VIP ที่กำลังรอตรวจสอบอยู่แล้ว' }, { status: 409 })

    const [vipRequest] = await sql`
      insert into vip_requests (user_id, name, email, phone, slip_name, slip_data_url)
      values (${user.id}, ${user.name}, ${user.email}, ${phone || null}, ${slipName || null}, ${slipDataUrl || null})
      returning id, status, created_at, updated_at
    `
    await writeAuditLog(env, currentUser, 'request_vip', 'vip_request', vipRequest.id, {
      phone,
      slipName,
      proofAttached: Boolean(slipDataUrl),
    })
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'vip_pending',
      title: 'มีคำขอ VIP ใหม่จากสมาชิก',
      detail: `${user.name} (${user.email}) รอการตรวจสอบ`,
      tone: 'amber',
      targetType: 'vip_request',
      targetId: vipRequest.id,
      fingerprint: `vip_request:${vipRequest.id}`,
    })
    await notifyTelegram(env, `MIKPURINUT Media Platform\nมีคำขอ VIP ใหม่\nชื่อ: ${user.name}\nอีเมล: ${user.email}`)

    return Response.json({
      ok: true,
      vipRequest: {
        id: vipRequest.id,
        phone,
        slipName,
        slipDataUrl,
        status: vipRequest.status,
        createdAt: vipRequest.created_at,
        updatedAt: vipRequest.updated_at,
      },
    }, { status: 201 })
  } catch (error) {
    await writeErrorLog(env, 'member.vip.request', error, { email: currentUser.email })
    return Response.json({
      ok: false,
      error: error instanceof InputValidationError ? error.message : 'ส่งคำขอ VIP ไม่สำเร็จ',
    }, { status: error instanceof InputValidationError ? 400 : 500 })
  }
}
