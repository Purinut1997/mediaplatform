import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

type PointRow = {
  label: string
  value: number
}

function mapRows(rows: PointRow[]) {
  return rows.map((row) => ({
    label: row.label,
    value: Number(row.value ?? 0),
  }))
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireAdminPermission(env, request, 'system:read'))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const [
    downloadsDaily,
    viewsDaily,
    membersMonthly,
    vipWeekly,
    topDownloads,
    accessBreakdown,
    statusBreakdown,
    sourceBreakdown,
    engagementRows,
  ] = await Promise.all([
    sql`
      with days as (
        select generate_series(current_date - interval '13 days', current_date, interval '1 day')::date as day
      )
      select to_char(days.day, 'DD Mon') as label, count(media_events.id)::int as value
      from days
      left join media_events
        on media_events.event_type = 'download'
        and media_events.created_at >= days.day
        and media_events.created_at < days.day + interval '1 day'
      group by days.day
      order by days.day asc
    `,
    sql`
      with days as (
        select generate_series(current_date - interval '13 days', current_date, interval '1 day')::date as day
      )
      select to_char(days.day, 'DD Mon') as label, count(media_events.id)::int as value
      from days
      left join media_events
        on media_events.event_type = 'view'
        and media_events.created_at >= days.day
        and media_events.created_at < days.day + interval '1 day'
      group by days.day
      order by days.day asc
    `,
    sql`
      with months as (
        select generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month')::date as month
      )
      select to_char(months.month, 'Mon YYYY') as label, count(users.id)::int as value
      from months
      left join users
        on users.created_at >= months.month
        and users.created_at < months.month + interval '1 month'
      group by months.month
      order by months.month asc
    `,
    sql`
      with weeks as (
        select generate_series(date_trunc('week', current_date) - interval '7 weeks', date_trunc('week', current_date), interval '1 week')::date as week
      )
      select to_char(weeks.week, 'DD Mon') as label, count(vip_requests.id)::int as value
      from weeks
      left join vip_requests
        on vip_requests.created_at >= weeks.week
        and vip_requests.created_at < weeks.week + interval '1 week'
      group by weeks.week
      order by weeks.week asc
    `,
    sql`
      select media.title as label, count(media_events.id)::int as value
      from media_events
      join media on media.id = media_events.media_id
      where media_events.event_type = 'download'
      group by media.id, media.title
      order by value desc, media.title asc
      limit 10
    `,
    sql`
      select access_level as label, count(*)::int as value
      from media
      group by access_level
      order by value desc, access_level asc
    `,
    sql`
      select status as label, count(*)::int as value
      from media
      group by status
      order by value desc, status asc
    `,
    sql`
      select source_type as label, count(*)::int as value
      from media
      group by source_type
      order by value desc, source_type asc
    `,
    sql`
      select
        count(*) filter (where event_type = 'view')::int as views_30d,
        count(*) filter (where event_type = 'download')::int as downloads_30d,
        (select count(*)::int from users where status = 'active') as active_users,
        (select count(*)::int from users where status = 'active' and access_level = 'VIP') as vip_users
      from media_events
      where created_at >= now() - interval '30 days'
    `,
  ])
  const [engagement] = engagementRows as Array<{
    views_30d: number
    downloads_30d: number
    active_users: number
    vip_users: number
  }>

  return Response.json({
    ok: true,
    analytics: {
      downloadsDaily: mapRows(downloadsDaily as PointRow[]),
      viewsDaily: mapRows(viewsDaily as PointRow[]),
      membersMonthly: mapRows(membersMonthly as PointRow[]),
      vipWeekly: mapRows(vipWeekly as PointRow[]),
      topDownloads: mapRows(topDownloads as PointRow[]),
      accessBreakdown: mapRows(accessBreakdown as PointRow[]),
      statusBreakdown: mapRows(statusBreakdown as PointRow[]),
      sourceBreakdown: mapRows(sourceBreakdown as PointRow[]),
      engagement: {
        views30d: Number(engagement?.views_30d ?? 0),
        downloads30d: Number(engagement?.downloads_30d ?? 0),
        activeUsers: Number(engagement?.active_users ?? 0),
        vipUsers: Number(engagement?.vip_users ?? 0),
      },
    },
  })
}
