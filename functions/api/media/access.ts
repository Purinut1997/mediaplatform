import { getCurrentUser } from '../../_lib/auth'
import { writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { canAccessLevel, hasPurchasedMedia } from '../../_lib/media-access'
import { recordMediaEvent } from '../../_lib/media-events'
import { safeHttpUrl } from '../../_lib/url'

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
      select id, title, access_level, status, available_from, available_until, download_limit
      from media where id = ${mediaId} and deleted_at is null limit 1
    `
    if (!media || !['เผยแพร่', 'เผยแพร่แล้ว'].includes(String(media.status))) {
      return Response.json({ ok: false, error: 'ไม่พบสื่อที่เผยแพร่' }, { status: 404 })
    }
    const now = Date.now()
    if ((media.available_from && Date.parse(String(media.available_from)) > now) ||
        (media.available_until && Date.parse(String(media.available_until)) <= now)) {
      return Response.json({ ok: false, error: 'สื่อนี้ยังไม่อยู่ในช่วงเวลาที่เปิดให้ดาวน์โหลด' }, { status: 403 })
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
    const purchased = await hasPurchasedMedia(env, user, mediaId)
    const canAccessMedia = purchased || canAccessLevel(user, String(media.access_level))
    const canAccessLink = purchased || canAccessLevel(user, String(link.access_level || media.access_level))
    if (!canAccessMedia || !canAccessLink) {
      return Response.json({ ok: false, error: 'บัญชีนี้ยังไม่มีสิทธิ์เปิดสื่อ' }, { status: 403 })
    }
    const limit = Number(media.download_limit ?? 0)
    if (limit > 0) {
      if (!user) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบเพื่อดาวน์โหลดสื่อนี้' }, { status: 401 })
      const [usage] = await sql`
        select count(*)::int as count from media_events
        where media_id = ${mediaId} and event_type = 'download' and lower(user_email) = ${user.email.toLowerCase()}
      `
      if (Number(usage?.count ?? 0) >= limit) {
        return Response.json({ ok: false, error: `บัญชีนี้ใช้สิทธิ์ดาวน์โหลดครบ ${limit.toLocaleString('th-TH')} ครั้งแล้ว` }, { status: 429 })
      }
    }

    const url = safeHttpUrl(link.url)
    if (!url) {
      return Response.json({ ok: false, error: 'ลิงก์สื่อนี้ไม่ปลอดภัยหรือไม่พร้อมใช้งาน' }, { status: 422 })
    }
    const counted = await recordMediaEvent(env, request, user, mediaId, 'download')
    return Response.json({ ok: true, url, label: link.label, counted })
  } catch (error) {
    await writeErrorLog(env, 'media.access', error)
    return Response.json({ ok: false, error: 'เปิดลิงก์สื่อไม่สำเร็จ' }, { status: 500 })
  }
}
