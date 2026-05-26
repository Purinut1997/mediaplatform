import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { notifyTelegram } from '../../_lib/notify'
import { writeNotification } from '../../_lib/notifications'

type AdminAction = {
  action?: 'approve-vip' | 'reject-vip' | 'set-access' | 'set-status' | 'set-role'
  requestId?: number
  userId?: number
  access?: 'สมาชิก' | 'VIP'
  role?: 'admin' | 'member'
  status?: 'active' | 'disabled'
}

async function requireSuperAdmin(env: Env, request: Request) {
  const currentUser = await getCurrentUser(env, request)
  return currentUser?.role === 'superadmin' ? currentUser : null
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const users = await sql`
    select id, name, email, role, access_level, status, created_at
    from users
    order by created_at desc
    limit 300
  `
  const vipRequests = await sql`
    select id, user_id, name, email, phone, slip_name, status, created_at
    from vip_requests
    order by created_at desc
    limit 200
  `

  return Response.json({
    ok: true,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      access: user.access_level,
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
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as AdminAction

  if (body.action === 'approve-vip' && body.requestId) {
    const [vipRequest] = await sql`
      update vip_requests
      set status = 'approved', updated_at = now()
      where id = ${body.requestId}
      returning user_id
    `
    if (vipRequest?.user_id) {
      await sql`
        update users
        set access_level = 'VIP', status = 'active', updated_at = now()
        where id = ${vipRequest.user_id}
      `
    }
    await writeAuditLog(env, currentUser, 'approve_vip', 'vip_request', body.requestId)
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'vip_resolved',
      title: 'อนุมัติคำขอ VIP แล้ว',
      detail: `Request ID ${body.requestId} ถูกอนุมัติ`,
      tone: 'emerald',
      targetType: 'vip_request',
      targetId: body.requestId,
      fingerprint: `vip_request:${body.requestId}:approved`,
    })
    await notifyTelegram(env, `MIKPURINUT Media Platform\nอนุมัติคำขอ VIP แล้ว\nRequest ID: ${body.requestId}`)
  } else if (body.action === 'reject-vip' && body.requestId) {
    await sql`
      update vip_requests
      set status = 'rejected', updated_at = now()
      where id = ${body.requestId}
    `
    await writeAuditLog(env, currentUser, 'reject_vip', 'vip_request', body.requestId)
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'vip_resolved',
      title: 'ปฏิเสธคำขอ VIP แล้ว',
      detail: `Request ID ${body.requestId} ถูกปฏิเสธ`,
      tone: 'red',
      targetType: 'vip_request',
      targetId: body.requestId,
      fingerprint: `vip_request:${body.requestId}:rejected`,
    })
    await notifyTelegram(env, `MIKPURINUT Media Platform\nปฏิเสธคำขอ VIP\nRequest ID: ${body.requestId}`)
  } else if (body.action === 'set-access' && body.userId && body.access) {
    await sql`
      update users
      set access_level = ${body.access}, updated_at = now()
      where id = ${body.userId} and role <> 'superadmin'
    `
    await writeAuditLog(env, currentUser, 'set_user_access', 'user', body.userId, { access: body.access })
  } else if (body.action === 'set-status' && body.userId && body.status) {
    await sql`
      update users
      set status = ${body.status}, updated_at = now()
      where id = ${body.userId} and role <> 'superadmin'
    `
    await writeAuditLog(env, currentUser, 'set_user_status', 'user', body.userId, { status: body.status })
  } else if (body.action === 'set-role' && body.userId && body.role) {
    await sql`
      update users
      set role = ${body.role}, updated_at = now()
      where id = ${body.userId} and role <> 'superadmin'
    `
    await writeAuditLog(env, currentUser, 'set_user_role', 'user', body.userId, { role: body.role })
  } else {
    return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
