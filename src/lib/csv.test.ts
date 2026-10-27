import { describe, expect, it } from 'vitest'
import { generateMediaCsvTemplate, parseCsvRows, parseMediaCsv } from './csv'

describe('csv helpers', () => {
  it('parses csv rows with quotes and commas inside quotes', () => {
    const raw = `ชื่อสื่อ,หมวดหมู่,แท็ก\n"สื่อวิทยาศาสตร์, ม.1",วิทยาศาสตร์,"ฟิสิกส์, เคมี, ชีวะ"`
    const rows = parseCsvRows(raw)
    expect(rows).toHaveLength(2)
    expect(rows[1][0]).toBe('สื่อวิทยาศาสตร์, ม.1')
    expect(rows[1][1]).toBe('วิทยาศาสตร์')
    expect(rows[1][2]).toBe('ฟิสิกส์, เคมี, ชีวะ')
  })

  it('parses media csv correctly and marks valid rows', () => {
    const template = generateMediaCsvTemplate(['คณิตศาสตร์', 'วิทยาศาสตร์'])
    const items = parseMediaCsv(template)
    expect(items.length).toBeGreaterThanOrEqual(3)
    expect(items[0].valid).toBe(true)
    expect(items[0].title).toContain('แผนการจัดการเรียนรู้วิทยาศาสตร์')
    expect(items[0].source).toBe('Google Drive')
    expect(items[1].access).toBe('VIP')
    expect(items[1].version).toBe('1.1.0')
    expect(items[1].changelog).toContain('เพิ่มเฉลยข้อ')
  })

  it('flags invalid rows when title is missing or url is malformed', () => {
    const badCsv = `ชื่อสื่อ,หมวดหมู่,ลิงก์ไฟล์\n,โรงเรียน,https://drive.google.com\nใบงานภาษาไทย,ภาษาไทย,not-a-valid-url`
    const items = parseMediaCsv(badCsv)
    expect(items).toHaveLength(2)
    expect(items[0].valid).toBe(false)
    expect(items[0].error).toBe('กรุณาระบุชื่อสื่อ')
    expect(items[1].valid).toBe(false)
    expect(items[1].error).toContain('ลิงก์ไฟล์ต้องขึ้นต้นด้วย')
  })
})
