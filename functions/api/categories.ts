import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { boundedText, InputValidationError } from '../_lib/input'

type CategoryRow = {
  id: number
  name: string
  slug: string
  sort_order: number
}

type CategoryPayload = {
  action?: 'rename' | 'move'
  name?: string
  newName?: string
  direction?: 'up' | 'down'
}

function categoryName(value: unknown) {
  return boundedText(value, 'ชื่อหมวดหมู่', { min: 1, max: 80 })
}

function categorySlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'category'
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return `${base}-${hash.toString(36)}`
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  await ensureSchema(env)
  const sql = getSql(env)

  const rows = (await sql`
    select id, name, slug, sort_order
    from categories
    order by sort_order asc, name asc
  `) as CategoryRow[]

  return Response.json({
    ok: true,
    categories: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sort_order,
    })),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'categories:write')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const body = (await request.json().catch(() => ({}))) as CategoryPayload
    const name = categoryName(body.name)
    const [existing] = await sql`select id from categories where lower(name) = ${name.toLowerCase()} limit 1`
    if (existing) return Response.json({ ok: false, error: 'มีหมวดหมู่นี้อยู่แล้ว' }, { status: 409 })

    await sql`
      insert into categories (name, slug, sort_order)
      values (${name}, ${categorySlug(name)}, (select coalesce(max(sort_order), 0) + 10 from categories))
    `
    await writeAuditLog(env, currentUser, 'create_category', 'category', name)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof InputValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    await writeErrorLog(env, 'categories.create', error)
    return Response.json({ ok: false, error: 'เพิ่มหมวดหมู่ไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'categories:write')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const body = (await request.json().catch(() => ({}))) as CategoryPayload
    const name = categoryName(body.name)
    const [category] = await sql`select id, sort_order from categories where name = ${name} limit 1`
    if (!category) return Response.json({ ok: false, error: 'ไม่พบหมวดหมู่' }, { status: 404 })

    if (body.action === 'rename') {
      const nextName = categoryName(body.newName)
      if (nextName === name) return Response.json({ ok: true })
      const [duplicate] = await sql`select id from categories where lower(name) = ${nextName.toLowerCase()} limit 1`
      if (duplicate) return Response.json({ ok: false, error: 'มีหมวดหมู่นี้อยู่แล้ว' }, { status: 409 })
      await sql.transaction((tx) => [
        tx`update categories set name = ${nextName}, slug = ${categorySlug(nextName)} where id = ${category.id}`,
        tx`update media set topic = ${nextName}, updated_at = now() where topic = ${name}`,
      ])
      await writeAuditLog(env, currentUser, 'rename_category', 'category', category.id, { from: name, to: nextName })
      return Response.json({ ok: true })
    }

    if (body.action === 'move' && ['up', 'down'].includes(String(body.direction))) {
      const direction = body.direction === 'up' ? 'up' : 'down'
      const [neighbor] = direction === 'up'
        ? await sql`select id, sort_order from categories where sort_order < ${category.sort_order} order by sort_order desc, id desc limit 1`
        : await sql`select id, sort_order from categories where sort_order > ${category.sort_order} order by sort_order asc, id asc limit 1`
      if (!neighbor) return Response.json({ ok: true })
      await sql.transaction((tx) => [
        tx`update categories set sort_order = ${neighbor.sort_order} where id = ${category.id}`,
        tx`update categories set sort_order = ${category.sort_order} where id = ${neighbor.id}`,
      ])
      await writeAuditLog(env, currentUser, 'move_category', 'category', category.id, { name, direction })
      return Response.json({ ok: true })
    }

    return Response.json({ ok: false, error: 'คำสั่งหมวดหมู่ไม่ถูกต้อง' }, { status: 400 })
  } catch (error) {
    if (error instanceof InputValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    await writeErrorLog(env, 'categories.update', error)
    return Response.json({ ok: false, error: 'แก้ไขหมวดหมู่ไม่สำเร็จ' }, { status: 500 })
  }
}

export const onRequestDelete = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'categories:write')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const name = categoryName(new URL(request.url).searchParams.get('name'))
    await ensureSchema(env)
    const sql = getSql(env)
    const [usage] = await sql`select count(*)::int as count from media where topic = ${name}`
    if (Number(usage?.count ?? 0) > 0) {
      return Response.json({ ok: false, error: 'หมวดหมู่นี้ยังมีสื่ออยู่ กรุณาย้ายหรือเปลี่ยนชื่อหมวดก่อนลบ' }, { status: 409 })
    }
    const [deleted] = await sql`delete from categories where name = ${name} returning id`
    if (!deleted) return Response.json({ ok: false, error: 'ไม่พบหมวดหมู่' }, { status: 404 })
    await writeAuditLog(env, currentUser, 'delete_category', 'category', deleted.id, { name })
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof InputValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    await writeErrorLog(env, 'categories.delete', error)
    return Response.json({ ok: false, error: 'ลบหมวดหมู่ไม่สำเร็จ' }, { status: 500 })
  }
}
