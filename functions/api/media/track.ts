import { getCurrentUser } from '../../_lib/auth'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { canAccessLevel } from '../../_lib/media-access'

type TrackPayload = {
  mediaId?: number
  eventType?: 'view' | 'download'
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const body = (await request.json().catch(() => ({}))) as TrackPayload
  const mediaId = Number(body.mediaId)
  const eventType = body.eventType === 'download' ? 'download' : body.eventType === 'view' ? 'view' : ''

  if (!Number.isInteger(mediaId) || mediaId <= 0 || !eventType) {
    return Response.json({ ok: false, error: 'Invalid tracking payload' }, { status: 400 })
  }

  const user = await getCurrentUser(env, request)
  const sql = getSql(env)
  const [media] = await sql`select id, access_level from media where id = ${mediaId} limit 1`
  if (!media) {
    return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })
  }
  if (eventType === 'download' && !canAccessLevel(user, String(media.access_level))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
  }

  await sql`
    insert into media_events (media_id, user_email, event_type)
    values (${mediaId}, ${user?.email ?? null}, ${eventType})
  `

  if (eventType === 'download') {
    await sql`update media set downloads = downloads + 1, updated_at = now() where id = ${mediaId}`
  } else {
    await sql`update media set views = views + 1 where id = ${mediaId}`
  }

  return Response.json({ ok: true })
}
