import { getCurrentUser } from '../../_lib/auth'
import { writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { canAccessLevel } from '../../_lib/media-access'
import { recordMediaEvent } from '../../_lib/media-events'

type AccessPayload = { mediaId?: number; linkId?: number }

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as AccessPayload
    const mediaId = Number(body.mediaId)
    const linkId = Number(body.linkId)
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      return Response.json({ ok: false, error: 'ข้อมูลสื่อไม่ถูกต้อง' }, { status: 400 })
    }

    const sql = getSql(env)
    const user = await getCurrentUser(env, request)
    const [media] = await sql`
      select id, title, access_level, status
      from media where id = ${mediaId} limit 1
    `
    if (!media || !['เผยแพร่', 'เผยแพร่แล้ว'].includes(String(media.status))) {
      return Response.json({ ok: false, error: 'ไม่พบสื่อที่เผยแพร่' }, { status: 404 })
    }

    const [link] = Number.isInteger(linkId) && linkId > 0
      ? await sql`
          select id, label, url, access_level
          from media_links where id = ${linkId} and media_id = ${mediaId} limit 1
        `
      : await sql`
          select id, label, url, access_level
          from media_links where media_id = ${mediaId} order by sort_order asc, id asc limit 1
        `
    if (!link) {
      return Response.json({ ok: false, error: 'สื่อนี้ยังไม่มีลิงก์ใช้งาน' }, { status: 404 })
    }
    if (
      !canAccessLevel(user, String(media.access_level)) ||
      !canAccessLevel(user, String(link.access_level || media.access_level))
    ) {
      return Response.json({ ok: false, error: 'บัญชีนี้ยังไม่มีสิทธิ์เปิดสื่อ' }, { status: 403 })
    }

    const counted = await recordMediaEvent(env, request, user, mediaId, 'download')
    return Response.json({ ok: true, url: link.url, label: link.label, counted })
  } catch (error) {
    await writeErrorLog(env, 'media.access', error)
    return Response.json({ ok: false, error: 'เปิดลิงก์สื่อไม่สำเร็จ' }, { status: 500 })
  }
}
