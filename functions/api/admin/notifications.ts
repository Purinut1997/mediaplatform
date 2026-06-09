import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { writeNotification } from '../../_lib/notifications'

type NotificationRow = {
  id: number
  audience: 'superadmin' | 'admin' | 'all'
  type: string
  title: string
  detail: string
  tone: 'sky' | 'amber' | 'red' | 'emerald'
  target_type: string | null
  target_id: string | null
  read_at: string | null
  created_at: string
}

type PatchPayload = {
  action?: 'mark-read' | 'mark-unread' | 'mark-all-read'
  id?: number
}

async function syncSystemNotifications(env: Env) {
  const sql = getSql(env)
  const resolve = (fingerprint: string) =>
    sql`update notifications set read_at = coalesce(read_at, now()) where fingerprint = ${fingerprint}`
  const [pendingVip] = await sql`
    select count(*)::int as count
    from vip_requests
    where status = 'pending'
  `
  if ((pendingVip?.count ?? 0) > 0) {
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'vip_pending',
      title: 'มีคำขอ VIP รอตรวจ',
      detail: `${pendingVip.count} รายการต้องตรวจสอบ`,
      tone: 'amber',
      targetType: 'vip_request',
      fingerprint: 'system:vip_pending',
    })
  } else {
    await resolve('system:vip_pending')
  }

  const [pendingMedia] = await sql`
    select count(*)::int as count
    from media
    where status = 'รอตรวจสอบ'
  `
  if ((pendingMedia?.count ?? 0) > 0) {
    await writeNotification(env, {
      audience: 'admin',
      type: 'media_review',
      title: 'มีสื่อรอตรวจสอบ',
      detail: `${pendingMedia.count} รายการควรตรวจก่อนเผยแพร่`,
      tone: 'sky',
      targetType: 'media',
      fingerprint: 'system:media_review',
    })
  } else {
    await resolve('system:media_review')
  }

  const [recentErrors] = await sql`
    select count(*)::int as count
    from error_logs
    where created_at > now() - interval '24 hours'
  `
  if ((recentErrors?.count ?? 0) > 0) {
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'error_24h',
      title: 'พบ Error ใน 24 ชั่วโมง',
      detail: `${recentErrors.count} รายการควรเปิดดู Error Log`,
      tone: 'red',
      targetType: 'error_logs',
      fingerprint: 'system:error_24h',
    })
  } else {
    await resolve('system:error_24h')
  }

  const [brokenLinks] = await sql`
    select count(*)::int as count
    from link_checks
    where status = 'error'
      and checked_at > now() - interval '24 hours'
  `
  if ((brokenLinks?.count ?? 0) > 0) {
    await writeNotification(env, {
      audience: 'admin',
      type: 'broken_links',
      title: 'มีลิงก์ที่ควรแก้',
      detail: `${brokenLinks.count} ลิงก์มีปัญหาจากการตรวจล่าสุด`,
      tone: 'red',
      targetType: 'media_links',
      fingerprint: 'system:broken_links',
    })
  } else {
    await resolve('system:broken_links')
  }

  const [site] = await sql`
    select value
    from app_settings
    where key = 'site'
    limit 1
  `
  const siteValue =
    typeof site?.value === 'string'
      ? JSON.parse(site.value)
      : site?.value
  if (siteValue?.maintenanceEnabled) {
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'maintenance',
      title: 'Maintenance Mode เปิดอยู่',
      detail: 'ผู้ใช้ทั่วไปจะเห็นหน้าปิดปรับปรุง',
      tone: 'amber',
      targetType: 'app_settings',
      targetId: 'site',
      fingerprint: 'system:maintenance',
    })
  } else {
    await resolve('system:maintenance')
  }
}

function canSee(row: { audience: string }, role: string) {
  if (role === 'superadmin') return true
  return row.audience === 'admin' || row.audience === 'all'
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'system:read')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  await syncSystemNotifications(env)
  const sql = getSql(env)
  const isSuperAdmin = currentUser.role === 'superadmin'
  const rows = (await sql`
    select id, audience, type, title, detail, tone, target_type, target_id, read_at, created_at
    from notifications
    where (${isSuperAdmin} or audience in ('admin', 'all'))
    order by read_at asc nulls first, created_at desc
    limit 80
  `) as NotificationRow[]
  const [countRow] = await sql`
    select
      count(*)::int as total,
      count(*) filter (where read_at is null)::int as unread
    from notifications
    where (${isSuperAdmin} or audience in ('admin', 'all'))
  `

  return Response.json({
    ok: true,
    total: Number(countRow?.total ?? 0),
    unread: Number(countRow?.unread ?? 0),
    notifications: rows.filter((row) => canSee(row, currentUser.role)).map((row) => ({
      id: row.id,
      audience: row.audience,
      type: row.type,
      title: row.title,
      detail: row.detail,
      tone: row.tone,
      targetType: row.target_type,
      targetId: row.target_id,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
  })
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'system:read')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as PatchPayload

  if (body.action === 'mark-all-read') {
    if (currentUser.role === 'superadmin') {
      await sql`update notifications set read_at = now() where read_at is null`
    } else {
      await sql`update notifications set read_at = now() where read_at is null and audience in ('admin', 'all')`
    }
  } else if (body.action === 'mark-read' && body.id) {
    if (currentUser.role === 'superadmin') {
      await sql`update notifications set read_at = now() where id = ${body.id}`
    } else {
      await sql`update notifications set read_at = now() where id = ${body.id} and audience in ('admin', 'all')`
    }
  } else if (body.action === 'mark-unread' && body.id) {
    if (currentUser.role === 'superadmin') {
      await sql`update notifications set read_at = null where id = ${body.id}`
    } else {
      await sql`update notifications set read_at = null where id = ${body.id} and audience in ('admin', 'all')`
    }
  } else {
    return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
