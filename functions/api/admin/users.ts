import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { notifyTelegram } from '../../_lib/notify'
import { writeNotification } from '../../_lib/notifications'
import { readPagination } from '../../_lib/pagination'

type AdminAction = {
  action?: 'approve-vip' | 'reject-vip' | 'approve-purchase' | 'reject-purchase' | 'set-access' | 'set-vip-expiry' | 'extend-vip' | 'set-status' | 'set-role' | 'grant-purchase' | 'revoke-purchase'
  requestId?: number
  userId?: number
  access?: 'สมาชิก' | 'VIP'
  role?: 'admin' | 'member'
  status?: 'active' | 'disabled'
  mediaId?: number
  days?: number
  vipExpiresAt?: string
}

async function requireSuperAdmin(env: Env, request: Request) {
  const currentUser = await getCurrentUser(env, request)
  return currentUser?.role === 'superadmin' ? currentUser : null
}

function positiveId(value: unknown) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : 0
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const url = new URL(request.url)
  const { page, pageSize, offset } = readPagination(url)
  const query = url.searchParams.get('query')?.trim().slice(0, 120) ?? ''
  const pattern = `%${query}%`
  const accessFilter = ['all', 'member', 'vip', 'expiring', 'expired'].includes(url.searchParams.get('access') ?? '')
    ? String(url.searchParams.get('access'))
    : 'all'
  const statusFilter = ['all', 'active', 'disabled'].includes(url.searchParams.get('status') ?? '')
    ? String(url.searchParams.get('status'))
    : 'all'
  const users = await sql`
    select id, name, email, role, access_level, vip_expires_at, status, created_at
    from users
    where (${query} = '' or name ilike ${pattern} or email ilike ${pattern})
      and (${statusFilter} = 'all' or status = ${statusFilter})
      and (
        ${accessFilter} = 'all'
        or (${accessFilter} = 'member' and access_level = 'สมาชิก')
        or (${accessFilter} = 'vip' and access_level = 'VIP' and (vip_expires_at is null or vip_expires_at > now()))
        or (${accessFilter} = 'expiring' and access_level = 'VIP' and vip_expires_at between now() and now() + interval '7 days')
        or (${accessFilter} = 'expired' and access_level = 'VIP' and vip_expires_at <= now())
      )
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `
  const [countRow] = await sql`
    select count(*)::int as total from users
    where (${query} = '' or name ilike ${pattern} or email ilike ${pattern})
      and (${statusFilter} = 'all' or status = ${statusFilter})
      and (
        ${accessFilter} = 'all'
        or (${accessFilter} = 'member' and access_level = 'สมาชิก')
        or (${accessFilter} = 'vip' and access_level = 'VIP' and (vip_expires_at is null or vip_expires_at > now()))
        or (${accessFilter} = 'expiring' and access_level = 'VIP' and vip_expires_at between now() and now() + interval '7 days')
        or (${accessFilter} = 'expired' and access_level = 'VIP' and vip_expires_at <= now())
      )
  `
  const [vipSummary] = await sql`
    select
      count(*) filter (where access_level = 'VIP' and (vip_expires_at is null or vip_expires_at > now()))::int as active,
      count(*) filter (where access_level = 'VIP' and vip_expires_at between now() and now() + interval '7 days')::int as expiring_soon,
      count(*) filter (where access_level = 'VIP' and vip_expires_at <= now())::int as expired
    from users
    where role <> 'superadmin'
  `
  const vipRequests = await sql`
    select id, user_id, name, email, phone, slip_name, status, created_at
    from vip_requests
    order by created_at desc
    limit 200
  `
  const purchaseRequests = await sql`
    select purchase_requests.id, purchase_requests.user_id, purchase_requests.media_id,
           users.name, users.email, media.title as media_title, purchase_requests.amount,
           purchase_requests.slip_name, purchase_requests.status, purchase_requests.created_at
    from purchase_requests
    join users on users.id = purchase_requests.user_id
    join media on media.id = purchase_requests.media_id
    order by purchase_requests.created_at desc limit 200
  `

  return Response.json({
    ok: true,
    page,
    pageSize,
    total: Number(countRow?.total ?? 0),
    vipSummary: {
      active: Number(vipSummary?.active ?? 0),
      expiringSoon: Number(vipSummary?.expiring_soon ?? 0),
      expired: Number(vipSummary?.expired ?? 0),
    },
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      access: user.access_level,
      vipExpiresAt: user.vip_expires_at,
      status: user.status,
      createdAt: user.created_at,
    })),
    vipRequests: vipRequests.map((request) => ({
      id: request.id,
      userId: request.user_id,
      name: request.name,
      email: request.email,
      phone: request.phone ?? '',
      slipName: request.slip_name ?? '',
      status: request.status,
      createdAt: request.created_at,
    })),
    purchaseRequests: purchaseRequests.map((item) => ({
      id: item.id,
      userId: item.user_id,
      mediaId: item.media_id,
      name: item.name,
      email: item.email,
      mediaTitle: item.media_title,
      amount: Number(item.amount ?? 0),
      slipName: item.slip_name ?? '',
      status: item.status,
      createdAt: item.created_at,
    })),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const body = (await request.json().catch(() => ({}))) as AdminAction
    const requestId = positiveId(body.requestId)
    const userId = positiveId(body.userId)
    const mediaId = positiveId(body.mediaId)

    if (body.action === 'approve-vip' && requestId) {
      const [siteSettings] = await sql`
        select coalesce((value->>'vipDurationDays')::int, 30) as vip_duration_days
        from app_settings where key = 'site' limit 1
      `
      const vipDurationDays = Math.min(3650, Math.max(1, Number(siteSettings?.vip_duration_days ?? 30)))
      const [vipRequest] = await sql`
        with approved as (
          update vip_requests
          set status = 'approved', updated_at = now()
          where id = ${requestId} and status = 'pending'
          returning user_id
        ),
        activated as (
          update users
          set access_level = 'VIP',
              vip_expires_at = greatest(coalesce(vip_expires_at, now()), now()) + make_interval(days => ${vipDurationDays}),
              status = 'active',
              updated_at = now()
          where id in (select user_id from approved where user_id is not null)
            and role <> 'superadmin'
          returning id
        )
        select approved.user_id, activated.id as activated_user_id
        from approved left join activated on activated.id = approved.user_id
      `
      if (!vipRequest) return Response.json({ ok: false, error: 'ไม่พบคำขอ VIP ที่รอตรวจสอบ' }, { status: 409 })
      if (vipRequest.user_id && !vipRequest.activated_user_id) {
        throw new Error('VIP request user could not be activated')
      }
      await writeAuditLog(env, currentUser, 'approve_vip', 'vip_request', requestId, { vipDurationDays })
      await writeNotification(env, {
        audience: 'superadmin',
        type: 'vip_resolved',
        title: 'อนุมัติคำขอ VIP แล้ว',
        detail: `Request ID ${requestId} ถูกอนุมัติ`,
        tone: 'emerald',
        targetType: 'vip_request',
        targetId: requestId,
        fingerprint: `vip_request:${requestId}:approved`,
      })
      await notifyTelegram(env, `MIKPURINUT Media Platform\nอนุมัติคำขอ VIP แล้ว\nRequest ID: ${requestId}`)
    } else if (body.action === 'reject-vip' && requestId) {
      const [vipRequest] = await sql`
        update vip_requests
        set status = 'rejected', updated_at = now()
        where id = ${requestId} and status = 'pending'
        returning id
      `
      if (!vipRequest) return Response.json({ ok: false, error: 'ไม่พบคำขอ VIP ที่รอตรวจสอบ' }, { status: 409 })
      await writeAuditLog(env, currentUser, 'reject_vip', 'vip_request', requestId)
      await writeNotification(env, {
        audience: 'superadmin',
        type: 'vip_resolved',
        title: 'ปฏิเสธคำขอ VIP แล้ว',
        detail: `Request ID ${requestId} ถูกปฏิเสธ`,
        tone: 'red',
        targetType: 'vip_request',
        targetId: requestId,
        fingerprint: `vip_request:${requestId}:rejected`,
      })
      await notifyTelegram(env, `MIKPURINUT Media Platform\nปฏิเสธคำขอ VIP\nRequest ID: ${requestId}`)
    } else if (body.action === 'approve-purchase' && requestId) {
      const [purchase] = await sql`
        with approved as (
          update purchase_requests set status = 'approved', updated_at = now()
          where id = ${requestId} and status = 'pending'
          returning user_id, media_id, amount
        )
        insert into media_purchases (user_id, media_id, amount, status, granted_by)
        select user_id, media_id, amount, 'active', ${currentUser.email} from approved
        on conflict (user_id, media_id) do update set
          amount = excluded.amount, status = 'active', granted_by = excluded.granted_by,
          granted_at = now(), refunded_at = null
        returning user_id, media_id
      `
      if (!purchase) return Response.json({ ok: false, error: 'ไม่พบคำขอซื้อที่รอตรวจสอบ' }, { status: 409 })
      await writeAuditLog(env, currentUser, 'approve_media_purchase', 'purchase_request', requestId, purchase)
    } else if (body.action === 'reject-purchase' && requestId) {
      const [purchase] = await sql`
        update purchase_requests set status = 'rejected', updated_at = now()
        where id = ${requestId} and status = 'pending' returning id
      `
      if (!purchase) return Response.json({ ok: false, error: 'ไม่พบคำขอซื้อที่รอตรวจสอบ' }, { status: 409 })
      await writeAuditLog(env, currentUser, 'reject_media_purchase', 'purchase_request', requestId)
    } else if (body.action === 'set-access' && userId && ['สมาชิก', 'VIP'].includes(String(body.access))) {
      const [siteSettings] = await sql`
        select coalesce((value->>'vipDurationDays')::int, 30) as vip_duration_days
        from app_settings where key = 'site' limit 1
      `
      const vipDurationDays = Math.min(3650, Math.max(1, Number(siteSettings?.vip_duration_days ?? 30)))
      const [updated] = await sql`
        update users
        set access_level = ${body.access},
            vip_expires_at = case
              when ${body.access} = 'VIP' then coalesce(vip_expires_at, now() + make_interval(days => ${vipDurationDays}))
              else null
            end,
            updated_at = now()
        where id = ${userId} and role <> 'superadmin' returning id
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสมาชิกที่แก้ไขสิทธิ์ได้' }, { status: 404 })
      await writeAuditLog(env, currentUser, 'set_user_access', 'user', userId, { access: body.access, vipDurationDays })
    } else if (body.action === 'extend-vip' && userId) {
      const days = Number(body.days)
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return Response.json({ ok: false, error: 'จำนวนวันต่ออายุ VIP ต้องอยู่ระหว่าง 1-3,650 วัน' }, { status: 400 })
      }
      const [updated] = await sql`
        update users
        set access_level = 'VIP',
            vip_expires_at = greatest(coalesce(vip_expires_at, now()), now()) + make_interval(days => ${days}),
            status = 'active',
            updated_at = now()
        where id = ${userId} and role <> 'superadmin'
        returning vip_expires_at
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสมาชิกที่ต่ออายุ VIP ได้' }, { status: 404 })
      await writeAuditLog(env, currentUser, 'extend_user_vip', 'user', userId, { days, vipExpiresAt: updated.vip_expires_at })
    } else if (body.action === 'set-vip-expiry' && userId) {
      const expiry = new Date(String(body.vipExpiresAt ?? ''))
      const maxExpiry = Date.now() + 3650 * 86400000
      if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now() || expiry.getTime() > maxExpiry) {
        return Response.json({ ok: false, error: 'วันหมดอายุ VIP ต้องเป็นวันในอนาคตและไม่เกิน 10 ปี' }, { status: 400 })
      }
      const [updated] = await sql`
        update users
        set access_level = 'VIP', vip_expires_at = ${expiry.toISOString()}, status = 'active', updated_at = now()
        where id = ${userId} and role <> 'superadmin'
        returning vip_expires_at
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสมาชิกที่กำหนดวันหมดอายุได้' }, { status: 404 })
      await writeAuditLog(env, currentUser, 'set_user_vip_expiry', 'user', userId, { vipExpiresAt: updated.vip_expires_at })
    } else if (body.action === 'grant-purchase' && userId && mediaId) {
      const [media] = await sql`select id, price from media where id = ${mediaId} and access_level = 'ซื้อแยก' limit 1`
      if (!media) return Response.json({ ok: false, error: 'ไม่พบสื่อซื้อแยกที่ต้องการให้สิทธิ์' }, { status: 404 })
      await sql`
        insert into media_purchases (user_id, media_id, amount, status, granted_by)
        values (${userId}, ${mediaId}, ${Number(media.price ?? 0)}, 'active', ${currentUser.email})
        on conflict (user_id, media_id) do update set
          amount = excluded.amount, status = 'active', granted_by = excluded.granted_by,
          granted_at = now(), refunded_at = null
      `
      await writeAuditLog(env, currentUser, 'grant_media_purchase', 'media', mediaId, { userId })
    } else if (body.action === 'revoke-purchase' && userId && mediaId) {
      const [updated] = await sql`
        update media_purchases set status = 'revoked'
        where user_id = ${userId} and media_id = ${mediaId} and status = 'active'
        returning id
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสิทธิ์ซื้อแยกที่กำลังใช้งาน' }, { status: 404 })
      await writeAuditLog(env, currentUser, 'revoke_media_purchase', 'media', mediaId, { userId })
    } else if (body.action === 'set-status' && userId && ['active', 'disabled'].includes(String(body.status))) {
      const [updated] = await sql`
        update users set status = ${body.status}, updated_at = now()
        where id = ${userId} and role <> 'superadmin' returning id
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสมาชิกที่เปิดหรือปิดบัญชีได้' }, { status: 404 })
      if (body.status === 'disabled') await sql`delete from sessions where user_id = ${userId}`
      await writeAuditLog(env, currentUser, 'set_user_status', 'user', userId, { status: body.status })
    } else if (body.action === 'set-role' && userId && ['admin', 'member'].includes(String(body.role))) {
      const [updated] = await sql`
        update users set role = ${body.role}, updated_at = now()
        where id = ${userId} and role <> 'superadmin' returning id
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบสมาชิกที่เปลี่ยนบทบาทได้' }, { status: 404 })
      await writeAuditLog(env, currentUser, 'set_user_role', 'user', userId, { role: body.role })
    } else {
      return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

    return Response.json({ ok: true })
  } catch (error) {
    await writeErrorLog(env, 'admin.users', error)
    return Response.json({ ok: false, error: 'จัดการสมาชิกไม่สำเร็จ' }, { status: 500 })
  }
}
