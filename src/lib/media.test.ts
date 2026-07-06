import { describe, expect, it } from 'vitest'
import {
  canViewAccess,
  createEmptyMediaForm,
  getImageDisplayUrl,
  getPreviewUrl,
  isPreviewImageUrl,
  normalizeAssetUrl,
  moveMediaLink,
  normalizeMediaStatus,
} from './media'

describe('frontend media helpers', () => {
  it('normalizes legacy media statuses', () => {
    expect(normalizeMediaStatus('เผยแพร่')).toBe('เผยแพร่แล้ว')
    expect(normalizeMediaStatus('แบบร่าง')).toBe('ฉบับร่าง')
    expect(normalizeMediaStatus('unknown')).toBe('ฉบับร่าง')
  })

  it('creates a complete media form', () => {
    const form = createEmptyMediaForm('AI')

    expect(form.topic).toBe('AI')
    expect(form.links).toHaveLength(1)
    expect(form.links[0].type).toBe('Google Drive')
  })

  it('enforces frontend access levels', () => {
    const member = { name: 'Member', email: 'member@example.com', role: 'member' as const, access: 'สมาชิก' as const }
    const vip = { ...member, access: 'VIP' as const }

    expect(canViewAccess(null, 'สาธารณะ')).toBe(true)
    expect(canViewAccess(member, 'สมาชิก')).toBe(true)
    expect(canViewAccess(member, 'VIP')).toBe(false)
    expect(canViewAccess(vip, 'VIP')).toBe(true)
    expect(canViewAccess(vip, 'ซื้อแยก')).toBe(false)
  })

  it('builds embeddable preview URLs', () => {
    const base = {
      id: 1,
      title: 'Preview',
      topic: 'AI',
      access: 'สาธารณะ' as const,
      status: 'เผยแพร่แล้ว' as const,
      price: 0,
      downloads: 0,
      views: 0,
      rating: 0,
      cover: '',
      description: '',
    }

    expect(getPreviewUrl({ ...base, source: 'YouTube', resourceUrl: 'https://youtu.be/video-id' }))
      .toBe('https://www.youtube.com/embed/video-id')
    expect(getPreviewUrl({ ...base, source: 'Google Drive', resourceUrl: 'https://drive.google.com/file/d/file-id/view' }))
      .toBe('https://drive.google.com/file/d/file-id/preview')
    expect(getPreviewUrl({ ...base, source: 'Google Sheet', resourceUrl: 'https://docs.google.com/spreadsheets/d/sheet-id/edit#gid=0' }))
      .toBe('https://docs.google.com/spreadsheets/d/sheet-id/preview')
    expect(getPreviewUrl({ ...base, source: 'Google Sheet', resourceUrl: 'https://docs.google.com/spreadsheets/d/sheet-id/copy' }))
      .toBe('https://docs.google.com/spreadsheets/d/sheet-id/preview')
    expect(getPreviewUrl({
      ...base,
      source: 'Google Drive',
      links: [
        { label: 'ไฟล์', type: 'Google Drive', url: 'https://drive.google.com/file/d/file-id/view', previewUrl: '', access: 'สาธารณะ' },
        { label: 'วิดีโอ', type: 'YouTube', url: 'https://youtu.be/video-id', previewUrl: '', access: 'สาธารณะ' },
      ],
    })).toBe('https://www.youtube.com/embed/video-id')
  })

  it('normalizes GitHub blob URLs for image display', () => {
    expect(normalizeAssetUrl('https://github.com/Purinut1997/web-images/blob/main/folder/cover.png'))
      .toBe('https://raw.githubusercontent.com/Purinut1997/web-images/main/folder/cover.png')
  })

  it('detects preview images and keeps them out of iframe previews', () => {
    const imageUrl = 'https://github.com/Purinut1997/web-images/blob/main/folder/screen.webp'
    expect(isPreviewImageUrl(imageUrl)).toBe(true)
    expect(getImageDisplayUrl('https://drive.google.com/file/d/drive-image-id/view'))
      .toBe('https://drive.google.com/thumbnail?id=drive-image-id&sz=w1600')
    expect(getPreviewUrl({
      id: 2,
      title: 'System',
      topic: 'AppScript',
      access: 'สมาชิก' as const,
      status: 'เผยแพร่แล้ว' as const,
      price: 0,
      downloads: 0,
      views: 0,
      rating: 0,
      cover: '',
      description: '',
      source: 'Google Sheet',
      links: [
        { label: 'ภาพตัวอย่าง', type: 'Preview Image', url: imageUrl, previewUrl: '', access: 'สมาชิก' as const },
        { label: 'ไฟล์หลัก', type: 'Google Sheet', url: 'https://docs.google.com/spreadsheets/d/sheet-id/copy', previewUrl: '', access: 'สมาชิก' as const },
      ],
    })).toBe('https://docs.google.com/spreadsheets/d/sheet-id/preview')
  })

  it('reorders media links without mutating the original list', () => {
    const links = [
      { label: 'ไฟล์', type: 'Google Drive' as const, url: 'https://example.com/file', previewUrl: '', access: 'สาธารณะ' as const },
      { label: 'วิดีโอ', type: 'YouTube' as const, url: 'https://youtu.be/video', previewUrl: '', access: 'สาธารณะ' as const },
    ]
    const moved = moveMediaLink(links, 1, 'up')

    expect(moved.map((link) => link.label)).toEqual(['วิดีโอ', 'ไฟล์'])
    expect(links.map((link) => link.label)).toEqual(['ไฟล์', 'วิดีโอ'])
    expect(moveMediaLink(links, 0, 'up')).toBe(links)
  })
})
