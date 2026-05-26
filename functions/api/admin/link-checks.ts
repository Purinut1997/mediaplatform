import { requireAdminPermission, writeAuditLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { notifyTelegram } from '../../_lib/notify'

type LinkRow = {
  media_id: number
  media_title: string
  media_link_id: number
  label: string
  type: string
  url: string
}

async function checkUrl(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6500)
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    })
    return {
      status: response.ok ? 'ok' : 'warning',
      statusCode: response.status,
      message: response.ok ? 'เปิดได้' : `ตอบกลับ ${response.status}`,
    }
  } catch (error) {
    return {
      status: 'error',
      statusCode: null,
      message: error instanceof Error ? error.message : 'เปิดลิงก์ไม่ได้',
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function runChecks(env: Env, request: Request) {
  const currentUser = await requireAdminPermission(env, request, 'links:check')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const rows = (await sql`
    select
      media.id as media_id,
      media.title as media_title,
      media_links.id as media_link_id,
      media_links.label,
      media_links.type,
      media_links.url
    from media_links
    join media on media.id = media_links.media_id
    where media_links.url <> ''
    order by media.updated_at desc, media_links.sort_order asc, media_links.id asc
    limit 50
  `) as LinkRow[]

  const results = []
  for (const row of rows) {
    const result = await checkUrl(row.url)
    await sql`
      insert into link_checks (media_id, media_link_id, url, status, status_code, message)
      values (${row.media_id}, ${row.media_link_id}, ${row.url}, ${result.status}, ${result.statusCode}, ${result.message})
    `
    results.push({
      mediaId: row.media_id,
      mediaTitle: row.media_title,
      linkId: row.media_link_id,
      label: row.label,
      type: row.type,
      url: row.url,
      ...result,
    })
  }

  await writeAuditLog(env, currentUser, 'link_check', 'media_links', null, {
    checked: results.length,
    errors: results.filter((result) => result.status === 'error').length,
  })
  const errorCount = results.filter((result) => result.status === 'error').length
  if (errorCount > 0) {
    await notifyTelegram(env, `MIKPURINUT Media Platform\nพบลิงก์มีปัญหา ${errorCount} รายการจากการตรวจล่าสุด`)
  }

  return Response.json({ ok: true, checkedAt: new Date().toISOString(), results })
}

export const onRequestGet = ({ env, request }: { env: Env; request: Request }) => runChecks(env, request)
export const onRequestPost = ({ env, request }: { env: Env; request: Request }) => runChecks(env, request)
