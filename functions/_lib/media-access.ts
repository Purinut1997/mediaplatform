import type { PublicUser } from './auth'

export function canAccessLevel(user: PublicUser | null, access: string) {
  if (user?.role === 'superadmin' || user?.role === 'admin') return true
  if (access === 'สาธารณะ') return true
  if (user?.access === 'VIP') return access === 'สมาชิก' || access === 'VIP'
  return user?.access === 'สมาชิก' && access === 'สมาชิก'
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
      ? link
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
