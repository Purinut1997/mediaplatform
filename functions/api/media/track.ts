import { getCurrentUser } from '../../_lib/auth'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { recordMediaEvent } from '../../_lib/media-events'

type TrackPayload = {
  mediaId?: number
  eventType?: 'view'
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const body = (await request.json().catch(() => ({}))) as TrackPayload
  const mediaId = Number(body.mediaId)
  const eventType = body.eventType === 'view' ? 'view' : ''

  if (!Number.isInteger(mediaId) || mediaId <= 0 || !eventType) {
    return Response.json({ ok: false, error: 'Invalid tracking payload' }, { status: 400 })
  }

  const user = await getCurrentUser(env, request)
  const sql = getSql(env)
  const [media] = await sql`
    select id
    from media
    where id = ${mediaId} and status in ('เผยแพร่', 'เผยแพร่แล้ว')
    limit 1
  `
  if (!media) {
    return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })
  }
  const counted = await recordMediaEvent(env, request, user, mediaId, 'view')
  return Response.json({ ok: true, counted })
}
