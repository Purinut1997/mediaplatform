import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import {
  mediaAccess,
  mediaPrice,
  mediaStatus,
  mediaText,
  MediaValidationError,
} from '../../_lib/media-validation'
import { optionalHttpUrl } from '../../_lib/url'
import { writeNotification } from '../../_lib/notifications'

const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

type ImportMediaItem = {
  title: string
  topic?: string
  access?: string
  status?: string
  price?: number
  source?: string
  cover?: string
  fileUrl?: string
  fileLabel?: string
  previewUrl?: string
  tags?: string[] | string
  description?: string
  version?: string
  changelog?: string
}

function tagSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'tag'
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return `${base}-${hash.toString(36)}`
}

function cleanTags(tags: string[] | string | undefined) {
  const raw = Array.isArray(tags) ? tags : String(tags ?? '').split(',')
  return Array.from(new Set(raw.map((t) => mediaText(t, 'แท็ก', 60)).filter(Boolean))).slice(0, 10)
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireAdminPermission(env, request, 'media:write')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureSchema(env)
    const sql = getSql(env)
    const body = (await request.json().catch(() => ({}))) as { items?: ImportMediaItem[] }
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return Response.json({ ok: false, error: 'ไม่พบรายการสื่อที่ต้องการนำเข้า' }, { status: 400 })
    }

    if (items.length > 100) {
      return Response.json({ ok: false, error: 'สามารถนำเข้าสื่อได้สูงสุดครั้งละ 100 รายการ' }, { status: 400 })
    }

    const timestamp = Date.now()
    const validatedItems = items.map((raw, index) => {
      const title = mediaText(raw.title, `ชื่อสื่อรายการที่ ${index + 1}`, 200)
      if (!title) {
        throw new MediaValidationError(`แถวที่ ${index + 1}: กรุณากรอกชื่อสื่อ`)
      }
      const topic = mediaText(raw.topic, `หมวดหมู่รายการที่ ${index + 1}`, 100, 'โรงเรียน') || 'โรงเรียน'
      const access = mediaAccess(raw.access)
      const status = mediaStatus(raw.status)
      const price = mediaPrice(raw.price)
      const source = mediaText(raw.source, `ชนิดสื่อรายการที่ ${index + 1}`, 80, 'Google Drive') || 'Google Drive'
      const coverUrl = optionalHttpUrl(raw.cover, `ลิงก์หน้าปกแถวที่ ${index + 1}`) || DEFAULT_COVER_URL
      const fileUrl = optionalHttpUrl(raw.fileUrl, `ลิงก์ไฟล์แถวที่ ${index + 1}`)
      const previewUrl = optionalHttpUrl(raw.previewUrl, `ลิงก์ตัวอย่างแถวที่ ${index + 1}`)
      const fileLabel = mediaText(raw.fileLabel, `ชื่อปุ่มแถวที่ ${index + 1}`, 120) || 'ดาวน์โหลดไฟล์'
      const description = mediaText(raw.description, `คำอธิบายแถวที่ ${index + 1}`, 10_000)
      const version = mediaText(raw.version, `เวอร์ชันแถวที่ ${index + 1}`, 30, '1.0.0') || '1.0.0'
      const changelog = mediaText(raw.changelog, `บันทึกการปรับปรุงแถวที่ ${index + 1}`, 5_000) || ''
      const tags = cleanTags(raw.tags)

      const slugBase =
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9ก-๙]+/g, '-')
          .replace(/^-|-$/g, '') || 'media'
      const slug = `${slugBase}-${timestamp}-${index + 1}`

      return {
        title,
        slug,
        topic,
        access,
        status,
        price,
        source,
        coverUrl,
        fileUrl,
        previewUrl,
        fileLabel,
        description,
        version,
        changelog,
        tags,
      }
    })

    // Run batch insert within transactions
    let importedCount = 0
    await sql.transaction((tx) => [
      ...validatedItems.flatMap((item, index) => {
        const statements = [
          tx`
            insert into media (
              title, slug, topic, access_level, status, price, cover_url, source_type, description,
              version, changelog, created_at, updated_at
            )
            values (
              ${item.title}, ${item.slug}, ${item.topic}, ${item.access}, ${item.status}, ${item.price},
              ${item.coverUrl}, ${item.source}, ${item.description}, ${item.version}, ${item.changelog},
              now() - (${validatedItems.length - index} * interval '1 millisecond'), now()
            )
          `,
        ]

        if (item.fileUrl || item.previewUrl) {
          statements.push(tx`
            insert into media_links (media_id, label, type, url, preview_url, access_level, sort_order)
            select id, ${item.fileLabel}, ${item.source}, ${item.fileUrl || ''}, ${item.previewUrl || null}, ${item.access}, 0
            from media where slug = ${item.slug}
          `)
        }

        for (const tag of item.tags) {
          statements.push(
            tx`
              insert into tags (name, slug)
              values (${tag}, ${tagSlug(tag)})
              on conflict (name) do update set name = excluded.name
            `,
            tx`
              insert into media_tags (media_id, tag_id)
              select media.id, tags.id from media cross join tags
              where media.slug = ${item.slug} and tags.name = ${tag}
              on conflict do nothing
            `,
          )
        }

        return statements
      }),
      tx`
        insert into audit_logs (actor, action, target_type, detail)
        values (
          ${currentUser.email}, 'batch_import', 'media',
          ${JSON.stringify({ count: validatedItems.length, timestamp })}::jsonb
        )
      `,
    ])

    importedCount = validatedItems.length

    await writeNotification(env, {
      audience: 'all',
      type: 'media_batch_imported',
      title: 'มีสื่อการสอนใหม่ในระบบ',
      detail: `อัปเดตสื่อการเรียนรู้ชุดใหม่จำนวน ${importedCount} รายการในคลัง สามารถเลือกสำรวจและดาวน์โหลดได้แล้ว`,
      tone: 'emerald',
      targetType: 'media_batch',
      fingerprint: `media_batch:${timestamp}`,
    })

    return Response.json({
      ok: true,
      importedCount,
      message: `นำเข้าสื่อการสอนสำเร็จ ${importedCount} รายการ`,
    })
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    console.error('Batch import failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'นำเข้าสื่อไม่สำเร็จ' },
      { status: 500 },
    )
  }
}
