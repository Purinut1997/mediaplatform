import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

type ServiceBody = {
  action?: string
  id?: number
  ids?: number[]
  title?: string
  url?: string
  description?: string
  category?: string
  iconDataUrl?: string
  pinned?: boolean
}

function serviceUrl(value: unknown) {
  try {
    const url = new URL(String(value ?? '').trim())
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function serviceIcon(value: unknown) {
  const icon = String(value ?? '')
  if (!icon) return ''
  if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(icon)) return null
  const encoded = icon.slice(icon.indexOf(',') + 1)
  const bytes = Math.floor(encoded.length * 3 / 4) - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0)
  return bytes <= 80 * 1024 ? icon : null
}

function serviceRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: String(row.title),
    url: String(row.url),
    description: String(row.description ?? ''),
    category: String(row.category ?? 'งานทั่วไป'),
    iconDataUrl: String(row.icon_data_url ?? ''),
    source: row.source === 'purchased' ? 'purchased' : 'custom',
    pinned: Boolean(row.pinned),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

async function context(env: Env, request: Request) {
  const viewer = await getCurrentUser(env, request)
  if (!viewer) return null
  const sql = getSql(env)
  const [user] = await sql`
    select id, email, role, access_level, eservice_limit_override
    from users where lower(email) = ${viewer.email.toLowerCase()} limit 1
  `
  return user ? { viewer, user, sql } : null
}

async function quota(sql: ReturnType<typeof getSql>, user: Record<string, unknown>) {
  const [row] = await sql`
    select
      coalesce((select count(*)::int from user_services where user_id = ${user.id} and source = 'custom'), 0) as used,
      coalesce((select (value->>'eserviceMemberLimit')::int from app_settings where key = 'site'), 6) as member_limit,
      coalesce((select (value->>'eserviceVipLimit')::int from app_settings where key = 'site'), 18) as vip_limit
  `
  const unlimited = user.role === 'admin' || user.role === 'superadmin'
  const fallback = user.access_level === 'VIP' ? Number(row?.vip_limit ?? 18) : Number(row?.member_limit ?? 6)
  const limit = unlimited ? null : user.eservice_limit_override === null ? fallback : Number(user.eservice_limit_override)
  const used = Number(row?.used ?? 0)
  return { limit, used, remaining: limit === null ? null : Math.max(0, limit - used) }
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const ctx = await context(env, request)
  if (!ctx) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  const rows = await ctx.sql`
    select id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at
    from user_services where user_id = ${ctx.user.id}
    order by category, sort_order, pinned desc, created_at desc
  `
  return Response.json({ ok: true, services: rows.map(serviceRow), quota: await quota(ctx.sql, ctx.user) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const ctx = await context(env, request)
  if (!ctx) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  try {
    const body = (await request.json().catch(() => ({}))) as ServiceBody
    const title = String(body.title ?? '').trim().slice(0, 80)
    const url = serviceUrl(body.url)
    const description = String(body.description ?? '').trim().slice(0, 160)
    const category = String(body.category ?? '').trim().slice(0, 40) || 'งานทั่วไป'
    const icon = serviceIcon(body.iconDataUrl)
    if (!title || !url || icon === null) return Response.json({ ok: false, error: 'ข้อมูล E-Service หรือไอคอนไม่ถูกต้อง' }, { status: 400 })
    const currentQuota = await quota(ctx.sql, ctx.user)
    if (currentQuota.limit !== null && currentQuota.used >= currentQuota.limit) {
      return Response.json({ ok: false, error: `ใช้ช่องเพิ่มเองครบ ${currentQuota.limit} ช่องแล้ว` }, { status: 409 })
    }
    const [nextOrder] = await ctx.sql`
      select coalesce(max(sort_order), 0) + 10 as value
      from user_services
      where user_id = ${ctx.user.id} and category = ${category}
    `
    const [created] = await ctx.sql`
      insert into user_services (user_id, title, url, description, category, icon_data_url, source, sort_order)
      values (${ctx.user.id}, ${title}, ${url}, ${description}, ${category}, ${icon ?? ''}, 'custom', ${Number(nextOrder?.value ?? 10)})
      returning id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at
    `
    await writeAuditLog(env, ctx.viewer, 'create_eservice', 'user_service', created.id, { title })
    return Response.json({ ok: true, service: serviceRow(created), quota: await quota(ctx.sql, ctx.user) }, { status: 201 })
  } catch (error) {
    await writeErrorLog(env, 'member.services.create', error)
    return Response.json({ ok: false, error: 'เพิ่ม E-Service ไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const ctx = await context(env, request)
  if (!ctx) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  try {
    const body = (await request.json().catch(() => ({}))) as ServiceBody
    if (body.action === 'reorder') {
      const category = String(body.category ?? '').trim().slice(0, 40) || 'งานทั่วไป'
      const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0).slice(0, 200) : []
      if (!ids.length) return Response.json({ ok: false, error: 'ไม่มีรายการสำหรับจัดลำดับ' }, { status: 400 })
      const rows = await ctx.sql`
        select id
        from user_services
        where user_id = ${ctx.user.id} and category = ${category} and id = any(${ids})
      `
      const allowed = new Set(rows.map((row) => Number(row.id)))
      if (allowed.size !== ids.length) return Response.json({ ok: false, error: 'พบรายการที่ไม่ได้อยู่ในหมวดนี้' }, { status: 400 })
      for (const [index, itemId] of ids.entries()) {
        await ctx.sql`
          update user_services
          set sort_order = ${(index + 1) * 10}, updated_at = now()
          where id = ${itemId} and user_id = ${ctx.user.id}
        `
      }
      const updatedRows = await ctx.sql`
        select id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at
        from user_services where user_id = ${ctx.user.id}
        order by category, sort_order, pinned desc, created_at desc
      `
      await writeAuditLog(env, ctx.viewer, 'reorder_eservice', 'user_service', ctx.user.id, { category, count: ids.length })
      return Response.json({ ok: true, services: updatedRows.map(serviceRow) })
    }
    const id = Number(body.id)
    if (!Number.isInteger(id) || id < 1) return Response.json({ ok: false, error: 'ไม่พบรายการ' }, { status: 400 })
    if (typeof body.pinned === 'boolean') {
      const [updated] = await ctx.sql`
        update user_services set pinned = ${body.pinned}, updated_at = now()
        where id = ${id} and user_id = ${ctx.user.id} and source = 'custom'
        returning id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at
      `
      if (!updated) return Response.json({ ok: false, error: 'ไม่พบรายการที่แก้ไขได้' }, { status: 404 })
      return Response.json({ ok: true, service: serviceRow(updated) })
    }
    const title = String(body.title ?? '').trim().slice(0, 80)
    const url = serviceUrl(body.url)
    const description = String(body.description ?? '').trim().slice(0, 160)
    const category = String(body.category ?? '').trim().slice(0, 40) || 'งานทั่วไป'
    const icon = serviceIcon(body.iconDataUrl)
    if (!title || !url || icon === null) return Response.json({ ok: false, error: 'ข้อมูล E-Service หรือไอคอนไม่ถูกต้อง' }, { status: 400 })
    const [updated] = await ctx.sql`
      update user_services set title = ${title}, url = ${url}, description = ${description}, category = ${category}, icon_data_url = ${icon ?? ''}, updated_at = now()
      where id = ${id} and user_id = ${ctx.user.id} and source = 'custom'
      returning id, title, url, description, category, icon_data_url, source, pinned, sort_order, created_at, updated_at
    `
    if (!updated) return Response.json({ ok: false, error: 'ไม่พบรายการที่แก้ไขได้' }, { status: 404 })
    await writeAuditLog(env, ctx.viewer, 'update_eservice', 'user_service', id, { title })
    return Response.json({ ok: true, service: serviceRow(updated) })
  } catch (error) {
    await writeErrorLog(env, 'member.services.update', error)
    return Response.json({ ok: false, error: 'แก้ไข E-Service ไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestDelete = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const ctx = await context(env, request)
  if (!ctx) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id < 1) return Response.json({ ok: false, error: 'ไม่พบรายการ' }, { status: 400 })
  const [deleted] = await ctx.sql`delete from user_services where id = ${id} and user_id = ${ctx.user.id} and source = 'custom' returning id`
  if (!deleted) return Response.json({ ok: false, error: 'ไม่พบรายการที่ลบได้' }, { status: 404 })
  await writeAuditLog(env, ctx.viewer, 'delete_eservice', 'user_service', id)
  return Response.json({ ok: true, quota: await quota(ctx.sql, ctx.user) })
}
