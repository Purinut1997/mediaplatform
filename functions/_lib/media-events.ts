import type { PublicUser } from './auth'
import { getSql, sha256Hex, type Env } from './db'
import { requestIp } from './rate-limit'

export async function recordMediaEvent(
  env: Env,
  request: Request,
  user: PublicUser | null,
  mediaId: number,
  eventType: 'view' | 'download',
) {
  const sql = getSql(env)
  const actor = user?.email ?? `anonymous:${(await sha256Hex(requestIp(request))).slice(0, 24)}`
  const dedupeMinutes = eventType === 'download' ? 10 : 30
  const [result] = await sql`
    with inserted as (
      insert into media_events (media_id, user_email, event_type)
      select ${mediaId}, ${actor}, ${eventType}
      where not exists (
        select 1
        from media_events
        where media_id = ${mediaId}
          and user_email = ${actor}
          and event_type = ${eventType}
          and created_at > now() - make_interval(mins => ${dedupeMinutes})
      )
      returning id
    )
    update media
    set
      downloads = downloads + case when ${eventType} = 'download' then (select count(*)::int from inserted) else 0 end,
      views = views + case when ${eventType} = 'view' then (select count(*)::int from inserted) else 0 end,
      updated_at = case when exists (select 1 from inserted) then now() else updated_at end
    where id = ${mediaId}
    returning exists (select 1 from inserted) as counted
  `
  return Boolean(result?.counted)
}
