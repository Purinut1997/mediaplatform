import type { AccessLevel, BatchImportRow, MediaSource, MediaStatus } from '../types'

/**
 * Robust CSV parser that handles quotes, escaped quotes, newlines, and commas.
 */
export function parseCsvRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim()
  if (!cleanText) return []

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\r') {
        if (nextChar === '\n') i++
        currentRow.push(currentField.trim())
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow)
        currentRow = []
        currentField = ''
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow)
        currentRow = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) rows.push(currentRow)
  }

  return rows
}

function normalizeAccess(raw: string): AccessLevel {
  const text = raw.trim()
  if (text === 'VIP' || text.toUpperCase() === 'VIP') return 'VIP'
  if (text === 'สมาชิก' || text.toLowerCase() === 'member') return 'สมาชิก'
  if (text === 'ซื้อแยก' || text.toLowerCase() === 'purchase') return 'ซื้อแยก'
  return 'สาธารณะ'
}

function normalizeStatus(raw: string): MediaStatus {
  const text = raw.trim()
  if (text === 'เผยแพร่' || text === 'เผยแพร่แล้ว' || text.toLowerCase() === 'published') return 'เผยแพร่แล้ว'
  if (text === 'รอตรวจสอบ' || text.toLowerCase() === 'pending') return 'รอตรวจสอบ'
  if (text === 'ซ่อน' || text === 'ซ่อนชั่วคราว' || text.toLowerCase() === 'hidden') return 'ซ่อนชั่วคราว'
  if (text === 'ถูกปฏิเสธ' || text.toLowerCase() === 'rejected') return 'ถูกปฏิเสธ'
  return 'ฉบับร่าง'
}

function normalizeSource(raw: string): MediaSource {
  const text = raw.trim()
  if (/sheet/i.test(text)) return 'Google Sheet'
  if (/youtube/i.test(text)) return 'YouTube'
  if (/external|link|เว็บ/i.test(text)) return 'External Link'
  return 'Google Drive'
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Parses CSV text and maps it into validated BatchImportRow items.
 */
export function parseMediaCsv(csvText: string, defaultTopic = 'โรงเรียน'): BatchImportRow[] {
  const rows = parseCsvRows(csvText)
  if (rows.length < 2) return []

  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''))
  const colIndex = (keys: string[]) =>
    headerRow.findIndex((h) => keys.some((k) => h.includes(k.toLowerCase())))

  const idxTitle = colIndex(['ชื่อสื่อ', 'ชื่อ', 'title', 'name'])
  const idxTopic = colIndex(['หมวดหมู่', 'หมวด', 'topic', 'category'])
  const idxAccess = colIndex(['ระดับสิทธิ์', 'สิทธิ์', 'access', 'accesslevel'])
  const idxStatus = colIndex(['สถานะ', 'status'])
  const idxPrice = colIndex(['ราคา', 'price'])
  const idxSource = colIndex(['ชนิดสื่อ', 'แหล่งที่มา', 'source', 'type'])
  const idxFileUrl = colIndex(['ลิงก์ไฟล์', 'ลิงก์', 'fileurl', 'url', 'link'])
  const idxFileLabel = colIndex(['ชื่อปุ่ม', 'ชื่อไฟล์', 'filelabel', 'label'])
  const idxCover = colIndex(['ลิงก์ภาพหน้าปก', 'หน้าปก', 'cover', 'coverurl', 'image'])
  const idxPreview = colIndex(['ลิงก์ตัวอย่าง', 'ตัวอย่าง', 'preview', 'previewurl'])
  const idxTags = colIndex(['แท็ก', 'tags', 'tag'])
  const idxDesc = colIndex(['คำอธิบาย', 'รายละเอียด', 'description', 'detail'])
  const idxVersion = colIndex(['เวอร์ชัน', 'version'])
  const idxChangelog = colIndex(['บันทึกอัปเดต', 'บันทึกการปรับปรุง', 'changelog'])

  const results: BatchImportRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length === 0 || row.every((c) => !c.trim())) continue

    const get = (idx: number, fallback = '') => (idx >= 0 && idx < row.length ? row[idx].trim() : fallback)

    const title = get(idxTitle)
    const topic = get(idxTopic) || defaultTopic
    const access = normalizeAccess(get(idxAccess))
    const status = normalizeStatus(get(idxStatus))
    const priceNum = Math.max(0, parseInt(get(idxPrice, '0'), 10) || 0)
    const source = normalizeSource(get(idxSource))
    const fileUrl = get(idxFileUrl)
    const fileLabel = get(idxFileLabel) || 'ดาวน์โหลดไฟล์'
    const cover = get(idxCover)
    const previewUrl = get(idxPreview)
    const tags = get(idxTags)
    const description = get(idxDesc)
    const version = get(idxVersion) || '1.0.0'
    const changelog = get(idxChangelog)

    let error: string | undefined
    let valid = true

    if (!title) {
      valid = false
      error = 'กรุณาระบุชื่อสื่อ'
    } else if (fileUrl && !isValidHttpUrl(fileUrl)) {
      valid = false
      error = 'ลิงก์ไฟล์ต้องขึ้นต้นด้วย http:// หรือ https://'
    } else if (cover && !isValidHttpUrl(cover)) {
      valid = false
      error = 'ลิงก์ภาพหน้าปกต้องขึ้นต้นด้วย http:// หรือ https://'
    } else if (previewUrl && !isValidHttpUrl(previewUrl)) {
      valid = false
      error = 'ลิงก์ตัวอย่างต้องขึ้นต้นด้วย http:// หรือ https://'
    }

    results.push({
      id: i,
      title,
      topic,
      access,
      status,
      price: priceNum,
      source,
      cover,
      fileUrl,
      fileLabel,
      previewUrl,
      tags,
      description,
      version,
      changelog,
      valid,
      error,
    })
  }

  return results
}

/**
 * Generates downloadable CSV template with UTF-8 BOM so Excel opens Thai cleanly.
 */
export function generateMediaCsvTemplate(sampleTopics: string[] = []): string {
  const topic1 = sampleTopics[0] || 'แผนการสอน'
  const topic2 = sampleTopics[1] || 'ใบงาน'
  const topic3 = sampleTopics[2] || 'สไลด์การสอน'

  const headers = [
    'ชื่อสื่อ',
    'หมวดหมู่',
    'ระดับสิทธิ์',
    'สถานะ',
    'ราคา',
    'ชนิดสื่อ',
    'ลิงก์ไฟล์',
    'ชื่อปุ่มไฟล์',
    'ลิงก์ภาพหน้าปก',
    'ลิงก์ตัวอย่าง',
    'แท็ก',
    'คำอธิบาย',
    'เวอร์ชัน',
    'บันทึกอัปเดต',
  ]

  const sampleRows = [
    [
      'แผนการจัดการเรียนรู้วิทยาศาสตร์ ม.1 (หน่วยที่ 1 สารบริสุทธิ์)',
      topic1,
      'สมาชิก',
      'เผยแพร่แล้ว',
      '0',
      'Google Drive',
      'https://drive.google.com/file/d/example1/view',
      'ดาวน์โหลดแผนการสอน',
      '',
      '',
      '"วิทยาศาสตร์, ม.1, แผนการสอน"',
      'แผนการจัดการเรียนรู้บูรณาการ Active Learning พร้อมใบกิจกรรม',
      '1.0.0',
      'จัดทำฉบับเริ่มต้น',
    ],
    [
      'ชุดใบงานและแบบฝึกหัดคณิตศาสตร์ ป.6 พร้อมเฉลยละเอียด',
      topic2,
      'VIP',
      'เผยแพร่แล้ว',
      '0',
      'Google Sheet',
      'https://docs.google.com/spreadsheets/d/example2/edit',
      'เปิดใบงาน Google Sheet',
      '',
      '',
      '"คณิตศาสตร์, ป.6, ใบงาน, เฉลย"',
      'แบบฝึกทักษะคณิตศาสตร์เตรียมสอบ O-NET ครบทุกตัวชี้วัด',
      '1.1.0',
      'เพิ่มเฉลยข้อ 15-20 และปรับปรุงสูตรการคำนวณ',
    ],
    [
      'วิดีโอบรรยายประวัติศาสตร์ไทย ม.3 ตอน อยุธยาศึกษา',
      topic3,
      'สาธารณะ',
      'เผยแพร่แล้ว',
      '0',
      'YouTube',
      'https://www.youtube.com/watch?v=example3',
      'ชมวิดีโอบทเรียน',
      '',
      '',
      '"ประวัติศาสตร์, สังคมศึกษา, ม.3"',
      'วิดีโอแอนิเมชันประกอบการสอนวิชาประวัติศาสตร์',
      '1.0.0',
      'เวอร์ชันแรก',
    ],
  ]

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row) => row.join(',')),
  ].join('\r\n')

  return '\uFEFF' + csvContent
}
