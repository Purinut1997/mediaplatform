import type {
  AccessLevel,
  CurrentUser,
  MediaFormState,
  MediaItem,
  MediaLink,
  MediaStatus,
} from '../types'

const mediaStatuses: MediaStatus[] = ['ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ']

export function normalizeMediaStatus(status: string): MediaStatus {
  if (status === 'เผยแพร่') return 'เผยแพร่แล้ว'
  if (status === 'แบบร่าง') return 'ฉบับร่าง'
  if (status === 'ซ่อน') return 'ซ่อนชั่วคราว'
  return mediaStatuses.includes(status as MediaStatus) ? (status as MediaStatus) : 'ฉบับร่าง'
}

export function createEmptyMediaLink(): MediaLink {
  return {
    label: 'ไฟล์หลัก',
    type: 'Google Drive',
    url: '',
    previewUrl: '',
    access: 'สาธารณะ',
  }
}

export function createEmptyMediaForm(topic = 'โรงเรียน'): MediaFormState {
  return {
    title: '',
    topic,
    access: 'สาธารณะ',
    status: 'เผยแพร่แล้ว',
    price: '0',
    source: 'Google Drive',
    cover: '',
    resourceUrl: '',
    previewUrl: '',
    links: [createEmptyMediaLink()],
    tags: '',
    description: '',
    availableFrom: '',
    availableUntil: '',
    downloadLimit: '0',
  }
}

export function moveMediaLink(links: MediaLink[], index: number, direction: 'up' | 'down') {
  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || index >= links.length || nextIndex < 0 || nextIndex >= links.length) return links
  const next = [...links]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}

export function canViewAccess(user: CurrentUser | null, access: AccessLevel) {
  if (user?.role === 'superadmin' || user?.role === 'admin') return true
  if (access === 'สาธารณะ') return true
  if (user?.access === 'VIP') return access !== 'ซื้อแยก'
  if (user?.access === 'สมาชิก') return access === 'สมาชิก'
  return false
}

export function canViewMedia(user: CurrentUser | null, item: MediaItem) {
  return canViewAccess(user, item.access)
}

export function canAccessAdmin(user: CurrentUser | null) {
  return user?.role === 'superadmin' || user?.role === 'admin'
}

function safeUrl(value: string) {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

export function normalizeAssetUrl(value = '') {
  const url = safeUrl(value)
  if (!url) return value

  if (url.hostname === 'github.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const blobIndex = parts.indexOf('blob')
    if (parts.length >= 5 && blobIndex === 2) {
      const [owner, repo, , branch, ...pathParts] = parts
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${pathParts.join('/')}`
    }
  }

  if (url.hostname === 'raw.githubusercontent.com') return url.toString()

  return value
}

export function getEmbeddableUrl(link = '', source = '') {
  const cleanLink = normalizeAssetUrl(link.trim())
  if (!cleanLink) return ''

  if (source === 'YouTube' || /youtu\.be|youtube\.com/.test(cleanLink)) {
    const id =
      cleanLink.match(/[?&]v=([^&]+)/)?.[1] ||
      cleanLink.match(/youtu\.be\/([^?&]+)/)?.[1] ||
      cleanLink.match(/youtube\.com\/embed\/([^?&]+)/)?.[1] ||
      cleanLink.match(/youtube\.com\/shorts\/([^?&]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : cleanLink
  }

  if (source === 'Google Drive' || /drive\.google\.com/.test(cleanLink)) {
    const id = cleanLink.match(/\/d\/([^/]+)/)?.[1] || cleanLink.match(/[?&]id=([^&]+)/)?.[1]
    return id ? `https://drive.google.com/file/d/${id}/preview` : cleanLink
  }

  if (source === 'Google Sheet' || /docs\.google\.com\/spreadsheets/.test(cleanLink)) {
    const id = cleanLink.match(/\/spreadsheets\/d\/([^/]+)/)?.[1]
    return id ? `https://docs.google.com/spreadsheets/d/${id}/preview` : cleanLink.replace(/\/(edit|copy|view|pubhtml).*$/, '/preview')
  }

  return cleanLink
}

export function getPreviewUrl(item: MediaItem) {
  const primaryLink =
    item.links?.find((link) => link.previewUrl) ??
    item.links?.find((link) => link.type === 'YouTube' && link.url) ??
    item.links?.[0]
  const link = primaryLink?.previewUrl || primaryLink?.url || item.previewUrl || item.resourceUrl || ''
  if (!link) return ''

  const source = primaryLink?.type || item.source
  return getEmbeddableUrl(link, source)
}
