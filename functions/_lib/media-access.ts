import type { PublicUser } from './auth'
import type { Env } from './db'
import { getSql } from './db'
import { safeHttpUrl } from './url'

export function canAccessLevel(user: PublicUser | null, access: string) {
  if (user?.role === 'superadmin' || user?.role === 'admin') return true
  if (access === 'สาธารณะ') return true
  if (user?.access === 'VIP') return access === 'สมาชิก' || access === 'VIP'
  return user?.access === 'สมาชิก' && access === 'สมาชิก'
}

export async function hasPurchasedMedia(env: Env, user: PublicUser | null, mediaId: number) {
  if (!user || !Number.isInteger(mediaId) || mediaId <= 0) return false
  const sql = getSql(env)
  const [purchase] = await sql`
    select media_purchases.id
    from media_purchases
    join users on users.id = media_purchases.user_id
    where lower(users.email) = ${user.email.toLowerCase()}
      and media_purchases.media_id = ${mediaId}
      and media_purchases.status = 'active'
    limit 1
  `
  return Boolean(purchase)
}

export function hideProtectedLinks<T extends {
  access: string
  resourceUrl?: string
  previewUrl?: string
  links?: Array<{ access: string; url: string; previewUrl: string }>
}>(media: T, user: PublicUser | null) {
  const canAccessMedia = canAccessLevel(user, media.access)
  const links = (media.links ?? []).map((link) =>
    canAccessMedia && canAccessLevel(user, link.access)
      ? { ...link, url: safeHttpUrl(link.url), previewUrl: safeHttpUrl(link.previewUrl) }
      : { ...link, url: '', previewUrl: '' },
  )
  const first = links.find((link) => link.url || link.previewUrl)
  return {
    ...media,
    resourceUrl: first?.url ?? '',
    previewUrl: first?.previewUrl ?? '',
    links,
  }
}
