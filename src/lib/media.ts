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
  }
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

export function getPreviewUrl(item: MediaItem) {
  const primaryLink = item.links?.[0]
  const link = primaryLink?.previewUrl || primaryLink?.url || item.previewUrl || item.resourceUrl || ''
  if (!link) return ''

  const source = primaryLink?.type || item.source

  if (source === 'YouTube') {
    const id =
      link.match(/[?&]v=([^&]+)/)?.[1] ||
      link.match(/youtu\.be\/([^?&]+)/)?.[1] ||
      link.match(/youtube\.com\/embed\/([^?&]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : link
  }

  if (source === 'Google Drive') {
    const id = link.match(/\/d\/([^/]+)/)?.[1] || link.match(/[?&]id=([^&]+)/)?.[1]
    return id ? `https://drive.google.com/file/d/${id}/preview` : link
  }

  if (source === 'Google Sheet') return link.replace(/\/edit.*$/, '/preview')

  return link
}
