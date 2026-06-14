import { describe, expect, it } from 'vitest'
import { readPagination } from './pagination'

describe('API pagination', () => {
  it('reads page, size and offset safely', () => {
    expect(readPagination(new URL('https://example.com?page=3&pageSize=8'), {
      defaultPageSize: 8,
      minPageSize: 5,
      maxPageSize: 50,
    })).toEqual({ page: 3, pageSize: 8, offset: 16 })
  })

  it('clamps invalid and excessive values', () => {
    expect(readPagination(new URL('https://example.com?page=-4&pageSize=500'), {
      defaultPageSize: 8,
      minPageSize: 5,
      maxPageSize: 50,
    })).toEqual({ page: 1, pageSize: 50, offset: 0 })
  })
})
