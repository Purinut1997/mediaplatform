import { getCurrentUser } from '../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { boundedText, InputValidationError } from '../_lib/input'
import { writeNotification } from '../_lib/notifications'
import { enforceRateLimits, rateLimitResponse } from '../_lib/rate-limit'
import { paymentProofDataUrl } from '../_lib/payment-proof'

type PurchasePayload = { mediaId?: number; slipName?: string; slipDataUrl?: string }

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const sql = getSql(env)
  const requests = await sql`
    select purchase_requests.id, purchase_requests.media_id, media.title, purchase_requests.amount,
           purchase_requests.status, purchase_requests.created_at
    from purchase_requests
    join users on users.id = purchase_requests.user_id
    join media on media.id = purchase_requests.media_id
    where lower(users.email) = ${currentUser.email.toLowerCase()}
    order by purchase_requests.created_at desc limit 100
  `
  const purchases = await sql`
    select media_purchases.media_id, media.title, media_purchases.amount, media_purchases.granted_at
    from media_purchases
    join users on users.id = media_purchases.user_id
    join media on media.id = media_purchases.media_id
    where lower(users.email) = ${currentUser.email.toLowerCase()} and media_purchases.status = 'active'
    order by media_purchases.granted_at desc limit 100
  `
  return Response.json({ ok: true, requests, purchases })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const currentUser = await getCurrentUser(env, request)
    if (!currentUser) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนส่งคำขอซื้อ' }, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as PurchasePayload
    const mediaId = Number(body.mediaId)
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      return Response.json({ ok: false, error: 'ข้อมูลสื่อไม่ถูกต้อง' }, { status: 400 })
    }
    const slipName = boundedText(body.slipName, 'ชื่อไฟล์สลิป', { max: 200 })
    const slipDataUrl = paymentProofDataUrl(body.slipDataUrl)
    if (!slipName || !slipDataUrl) return Response.json({ ok: false, error: 'กรุณาแนบหลักฐานการชำระเงินก่อนส่งคำขอซื้อ' }, { status: 400 })
    const rateLimit = await enforceRateLimits(env, [{
      action: 'purchase-request:account',
      identifier: currentUser.email,
      limit: 10,
      windowSeconds: 3600,
      blockSeconds: 3600,
    }])
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)

    const sql = getSql(env)
    const [settings] = await sql`
      select coalesce((value->>'purchaseEnabled')::boolean, false) as enabled
      from app_settings where key = 'site' limit 1
    `
    if (!settings?.enabled) return Response.json({ ok: false, error: 'ขณะนี้ระบบซื้อสื่อแยกยังไม่เปิดใช้งาน' }, { status: 403 })
    const [user] = await sql`select id from users where lower(email) = ${currentUser.email.toLowerCase()} limit 1`
    const [media] = await sql`
      select id, title, price from media
      where id = ${mediaId} and deleted_at is null and access_level = 'ซื้อแยก' and price > 0
        and status in ('เผยแพร่', 'เผยแพร่แล้ว')
      limit 1
    `
    if (!user || !media) return Response.json({ ok: false, error: 'ไม่พบสื่อซื้อแยกที่เปิดจำหน่าย' }, { status: 404 })
    const [owned] = await sql`
      select id from media_purchases where user_id = ${user.id} and media_id = ${mediaId} and status = 'active' limit 1
    `
    if (owned) return Response.json({ ok: false, error: 'บัญชีนี้มีสิทธิ์ใช้สื่อนี้แล้ว' }, { status: 409 })
    const [pending] = await sql`
      select id from purchase_requests where user_id = ${user.id} and media_id = ${mediaId} and status = 'pending' limit 1
    `
    if (pending) return Response.json({ ok: false, error: 'มีคำขอซื้อรายการนี้รอตรวจสอบอยู่แล้ว' }, { status: 409 })
    const [created] = await sql`
      insert into purchase_requests (user_id, media_id, amount, slip_name, slip_data_url)
      values (${user.id}, ${mediaId}, ${Number(media.price ?? 0)}, ${slipName}, ${slipDataUrl})
      returning id
    `
    await writeAuditLog(env, currentUser, 'request_media_purchase', 'media', mediaId, { requestId: created.id })
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'purchase_pending',
      title: 'มีคำขอซื้อสื่อใหม่',
      detail: `${currentUser.email} ขอซื้อ ${media.title}`,
      tone: 'amber',
      targetType: 'purchase_request',
      targetId: created.id,
      fingerprint: `purchase_request:${created.id}`,
    })
    return Response.json({ ok: true, requestId: created.id }, { status: 201 })
  } catch (error) {
    if (error instanceof InputValidationError) return Response.json({ ok: false, error: error.message }, { status: 400 })
    await writeErrorLog(env, 'purchases.create', error)
    return Response.json({ ok: false, error: 'ส่งคำขอซื้อสื่อไม่สำเร็จ' }, { status: 500 })
  }
}
