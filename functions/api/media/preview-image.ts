import { writeErrorLog } from '../../_lib/admin'
import type { Env } from '../../_lib/db'
import { safeHttpUrl } from '../../_lib/url'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function isAllowedHost(hostname: string) {
  return hostname === 'photos.app.goo.gl' ||
    hostname === 'photos.google.com' ||
    hostname === 'lh3.googleusercontent.com' ||
    hostname.endsWith('.googleusercontent.com')
}

function extractMetaImage(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1]
    if (match) return match.replace(/&amp;/g, '&')
  }
  return ''
}

async function readImageResponse(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
      'user-agent': 'MIKPURINUT-MediaPlatform/1.0',
    },
    redirect: 'follow',
  })
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || !type.startsWith('image/')) return null
  const length = Number(response.headers.get('content-length') ?? 0)
  if (length > MAX_IMAGE_BYTES) return null
  const bytes = await response.arrayBuffer()
  if (bytes.byteLength > MAX_IMAGE_BYTES) return null
  return new Response(bytes, {
    headers: {
      'cache-control': 'public, max-age=21600',
      'content-type': type,
    },
  })
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    const rawUrl = new URL(request.url).searchParams.get('url') ?? ''
    const target = safeHttpUrl(rawUrl)
    if (!target) return Response.json({ ok: false, error: 'Invalid image URL' }, { status: 400 })
    const parsed = new URL(target)
    if (!isAllowedHost(parsed.hostname)) return Response.json({ ok: false, error: 'Unsupported image host' }, { status: 422 })

    const direct = await readImageResponse(target)
    if (direct) return direct

    const page = await fetch(target, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'MIKPURINUT-MediaPlatform/1.0',
      },
      redirect: 'follow',
    })
    if (!page.ok) return Response.json({ ok: false, error: 'Preview image not found' }, { status: 404 })
    const html = await page.text()
    const imageUrl = safeHttpUrl(extractMetaImage(html))
    if (!imageUrl) return Response.json({ ok: false, error: 'Preview image not found' }, { status: 404 })
    const imageHost = new URL(imageUrl).hostname
    if (!isAllowedHost(imageHost)) return Response.json({ ok: false, error: 'Unsupported image host' }, { status: 422 })
    const image = await readImageResponse(imageUrl)
    return image ?? Response.json({ ok: false, error: 'Preview image not found' }, { status: 404 })
  } catch (error) {
    await writeErrorLog(env, 'media.preview_image', error)
    return Response.json({ ok: false, error: 'Preview image failed' }, { status: 500 })
  }
}
