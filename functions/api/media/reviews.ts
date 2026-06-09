import { getCurrentUser } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { canAccessLevel } from '../../_lib/media-access'

type ReviewPayload = { mediaId?: number; rating?: number; comment?: string }

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const mediaId = Number(new URL(request.url).searchParams.get('mediaId'))
  if (!Number.isInteger(mediaId) || mediaId <= 0) return Response.json({ ok: false, error: 'Invalid media' }, { status: 400 })
  const sql = getSql(env)
  const rows = await sql`
    select media_reviews.id, media_reviews.rating, media_reviews.comment,
      media_reviews.updated_at, users.name
    from media_reviews
    join users on users.id = media_reviews.user_id
    join media on media.id = media_reviews.media_id
    where media_reviews.media_id = ${mediaId} and media.status in ('เผยแพร่', 'เผยแพร่แล้ว')
    order by media_reviews.updated_at desc limit 30
  `
  return Response.json({ ok: true, reviews: rows.map((row) => ({
    id: row.id, rating: row.rating, comment: row.comment, name: row.name, updatedAt: row.updated_at,
  })) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const currentUser = await getCurrentUser(env, request)
    if (!currentUser) return Response.json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนให้คะแนน' }, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as ReviewPayload
    const mediaId = Number(body.mediaId)
    const rating = Number(body.rating)
    const comment = String(body.comment ?? '').trim().slice(0, 500)
    if (!Number.isInteger(mediaId) || mediaId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ ok: false, error: 'คะแนนไม่ถูกต้อง' }, { status: 400 })
    }
    const sql = getSql(env)
    const [user] = await sql`select id from users where lower(email) = ${currentUser.email.toLowerCase()} limit 1`
    const [media] = await sql`
      select id, access_level from media
      where id = ${mediaId} and status in ('เผยแพร่', 'เผยแพร่แล้ว')
      limit 1
    `
    if (!user || !media) return Response.json({ ok: false, error: 'ไม่พบข้อมูล' }, { status: 404 })
    if (!canAccessLevel(currentUser, String(media.access_level))) {
      return Response.json({ ok: false, error: 'บัญชีนี้ยังไม่มีสิทธิ์ให้คะแนนสื่อนี้' }, { status: 403 })
    }
    await sql.transaction((tx) => [
      tx`
        insert into media_reviews (media_id, user_id, rating, comment)
        values (${mediaId}, ${user.id}, ${rating}, ${comment})
        on conflict (media_id, user_id) do update set rating = excluded.rating, comment = excluded.comment, updated_at = now()
      `,
      tx`
        update media set rating = (
          select round(avg(rating)::numeric, 1) from media_reviews where media_id = ${mediaId}
        ), updated_at = now() where id = ${mediaId}
      `,
    ])
    await writeAuditLog(env, currentUser, 'review_media', 'media', mediaId, { rating })
    return Response.json({ ok: true })
  } catch (error) {
    await writeErrorLog(env, 'media.review', error)
    return Response.json({ ok: false, error: 'บันทึกคะแนนไม่สำเร็จ' }, { status: 500 })
  }
}
