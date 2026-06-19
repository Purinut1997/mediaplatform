import { requireAdminPermission, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { duplicateMediaSlug, duplicateMediaTitle } from '../../_lib/media-duplicate'

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const user = await requireAdminPermission(env, request, 'media:write')
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { id?: unknown }
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ ok: false, error: 'รหัสสื่อไม่ถูกต้อง' }, { status: 400 })
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const [source] = await sql`select id, title, slug from media where id = ${id} and deleted_at is null limit 1`
    if (!source) return Response.json({ ok: false, error: 'ไม่พบสื่อที่ต้องการทำสำเนา' }, { status: 404 })

    const title = duplicateMediaTitle(source.title)
    const slug = duplicateMediaSlug(source.slug, id)
    await sql.transaction((tx) => [
      tx`
        insert into media (
          title, slug, topic, access_level, status, price, downloads, views, rating,
          cover_url, source_type, description, available_from, available_until, download_limit
        )
        select
          ${title}, ${slug}, topic, access_level, 'ฉบับร่าง', price, 0, 0, rating,
          cover_url, source_type, description, available_from, available_until, download_limit
        from media where id = ${id} and deleted_at is null
      `,
      tx`
        insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
        select target.id, links.label, links.type, links.url, links.preview_url, links.access_level, links.sort_order
        from media_links links
        cross join media target
        where links.media_id = ${id} and target.slug = ${slug}
      `,
      tx`
        insert into media_tags (media_id, tag_id)
        select target.id, media_tags.tag_id
        from media_tags
        cross join media target
        where media_tags.media_id = ${id} and target.slug = ${slug}
      `,
    ])

    const [copy] = await sql`select id, title from media where slug = ${slug} limit 1`
    await writeAuditLog(env, user, 'duplicate', 'media', copy.id, { sourceId: id, title })
    return Response.json({ ok: true, media: copy }, { status: 201 })
  } catch (error) {
    await writeErrorLog(env, 'media.duplicate', error, { sourceId: id })
    return Response.json({ ok: false, error: 'สร้างสำเนาสื่อไม่สำเร็จ' }, { status: 500 })
  }
}
