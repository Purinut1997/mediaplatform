import { describe, expect, it } from 'vitest'
import { duplicateMediaSlug, duplicateMediaTitle } from './media-duplicate'

describe('media duplication helpers', () => {
  it('marks copied media clearly and keeps titles bounded', () => {
    expect(duplicateMediaTitle('คู่มือ AI')).toBe('คู่มือ AI (สำเนา)')
    expect(duplicateMediaTitle('ก'.repeat(250))).toHaveLength(200)
  })

  it('creates a stable unique copy slug', () => {
    expect(duplicateMediaSlug('คู่มือ AI / 2026', 7, 1234)).toBe('คู่มือ-ai-2026-copy-7-1234')
  })
})
