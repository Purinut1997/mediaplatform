import { writeAuditLog } from './admin'
import { type PublicUser } from './auth'
import { ensureSchema, getSql, type Env } from './db'
import { notifyTelegram } from './notify'
import { writeNotification } from './notifications'
import { safeHttpUrl } from './url'

type LinkRow = {
  media_id: number
  media_title: string
  media_link_id: number
  label: string
  type: string
  url: string
}

export type LinkCheckResult = {
  mediaId: number
  mediaTitle: string
  linkId: number
  label: string
  type: string
  url: string
  status: 'ok' | 'warning' | 'error'
  statusCode: number | null
  message: string
}

type LinkCheckOptions = {
  auditAction?: string
  limit?: number
  notify?: boolean
}

async function fetchStatus(url: string, method: 'HEAD' | 'GET') {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6500)
  try {
    let currentUrl = url
    for (let redirect = 0; redirect <= 5; redirect += 1) {
      const response = await fetch(currentUrl, {
        method,
        redirect: 'manual',
        signal: controller.signal,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
      })
      if (![301, 302, 303, 307, 308].includes(response.status)) return response
      const location = response.headers.get('Location')
      await response.body?.cancel()
      const nextUrl = location ? safeHttpUrl(new URL(location, currentUrl).href) : ''
      if (!nextUrl) throw new Error('Redirect ไปยังลิงก์ที่ไม่ปลอดภัย')
      currentUrl = nextUrl
    }
    throw new Error('ลิงก์ Redirect มากเกินกำหนด')
  } finally {
    clearTimeout(timeout)
  }
}

async function checkUrl(url: string) {
  const safeUrl = safeHttpUrl(url)
  if (!safeUrl) {
    return {
      status: 'error',
      statusCode: null,
      message: 'ลิงก์ไม่ปลอดภัยหรือชี้ไปยังเครือข่ายภายใน',
    } as const
  }
  try {
    let response = await fetchStatus(safeUrl, 'HEAD')
    if ([403, 405, 501].includes(response.status)) {
      response = await fetchStatus(safeUrl, 'GET')
    }
    return {
      status: response.ok ? 'ok' : 'warning',
      statusCode: response.status,
      message: response.ok ? 'เปิดได้' : `ตอบกลับ ${response.status}`,
    } as const
  } catch (error) {
    return {
      status: 'error',
      statusCode: null,
      message: error instanceof Error ? error.message : 'เปิดลิงก์ไม่ได้',
    } as const
  }
}

export async function runLinkChecks(
  env: Env,
  actor: PublicUser | string,
  options: LinkCheckOptions = {},
) {
  await ensureSchema(env)
  const sql = getSql(env)
  const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 100)
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
    left join lateral (
      select max(checked_at) as last_checked_at
      from link_checks
      where link_checks.media_link_id = media_links.id
    ) last_check on true
    where media_links.url <> ''
    order by last_check.last_checked_at asc nulls first, media_links.id asc
    limit ${limit}
  `) as LinkRow[]

  const results: LinkCheckResult[] = []
  const batchSize = 10
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize)
    const batchResults = await Promise.all(batch.map(async (row) => {
      const result = await checkUrl(row.url)
      await sql`
        insert into link_checks (media_id, media_link_id, url, status, status_code, message)
        values (${row.media_id}, ${row.media_link_id}, ${row.url}, ${result.status}, ${result.statusCode}, ${result.message})
      `
      return {
        mediaId: row.media_id,
        mediaTitle: row.media_title,
        linkId: row.media_link_id,
        label: row.label,
        type: row.type,
        url: safeHttpUrl(row.url),
        ...result,
      }
    }))
    results.push(...batchResults)
  }

  const errorCount = results.filter((result) => result.status === 'error').length
  await writeAuditLog(env, actor, options.auditAction ?? 'link_check', 'media_links', null, {
    checked: results.length,
    errors: errorCount,
  })

  if (errorCount > 0 && options.notify !== false) {
    await writeNotification(env, {
      audience: 'admin',
      type: 'broken_links',
      title: 'พบลิงก์มีปัญหา',
      detail: `${errorCount} รายการจากการตรวจล่าสุด`,
      tone: 'red',
      targetType: 'media_links',
      fingerprint: `link_check:${new Date().toISOString().slice(0, 10)}:${errorCount}`,
    })
    await notifyTelegram(env, `MIKPURINUT Media Platform\nพบลิงก์มีปัญหา ${errorCount} รายการจากการตรวจล่าสุด`)
  }

  return {
    checkedAt: new Date().toISOString(),
    results,
  }
}
