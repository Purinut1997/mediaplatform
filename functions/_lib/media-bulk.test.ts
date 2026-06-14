import { describe, expect, it } from 'vitest'
import { readMediaBulkCommand } from './media-bulk'

describe('bulk media command validation', () => {
  it('deduplicates valid media ids and validates status', () => {
    expect(readMediaBulkCommand({
      action: 'status',
      ids: [3, 3, '4', -1, 'invalid'],
      value: 'เผยแพร่แล้ว',
    })).toEqual({
      action: 'status',
      ids: [3, 4],
      value: 'เผยแพร่แล้ว',
    })
  })

  it('accepts category moves and delete commands', () => {
    expect(readMediaBulkCommand({ action: 'topic', ids: [1], value: ' AI ' }).value).toBe('AI')
    expect(readMediaBulkCommand({ action: 'delete', ids: [1, 2] }).value).toBe('')
  })

  it('rejects empty, oversized and unsupported commands', () => {
    expect(() => readMediaBulkCommand({ action: 'delete', ids: [] })).toThrow()
    expect(() => readMediaBulkCommand({ action: 'delete', ids: Array.from({ length: 101 }, (_, index) => index + 1) })).toThrow()
    expect(() => readMediaBulkCommand({ action: 'archive', ids: [1] })).toThrow()
  })
})
