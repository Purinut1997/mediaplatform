import { mediaStatus, mediaText } from './media-validation'

export type MediaBulkAction = 'status' | 'topic' | 'delete'

export type MediaBulkCommand = {
  action: MediaBulkAction
  ids: number[]
  value: string
}

export function readMediaBulkCommand(value: unknown): MediaBulkCommand {
  const body = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const action = String(body.action ?? '') as MediaBulkAction
  if (!['status', 'topic', 'delete'].includes(action)) {
    throw new Error('คำสั่งจัดการสื่อไม่ถูกต้อง')
  }

  const ids = Array.from(new Set(
    (Array.isArray(body.ids) ? body.ids : [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0),
  ))
  if (!ids.length || ids.length > 100) {
    throw new Error('กรุณาเลือกสื่อ 1-100 รายการ')
  }

  const commandValue =
    action === 'status'
      ? mediaStatus(body.value)
      : action === 'topic'
        ? mediaText(body.value, 'หมวดหมู่', 100)
        : ''
  if (action === 'topic' && !commandValue) throw new Error('กรุณาเลือกหมวดหมู่')

  return { action, ids, value: commandValue }
}
