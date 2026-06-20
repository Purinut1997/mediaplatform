export type PaymentProof = {
  dataUrl: string
  name: string
}

const MAX_PAYMENT_PROOF_BYTES = 750_000
const MAX_PAYMENT_PROOF_SOURCE_BYTES = 12 * 1024 * 1024
const PAYMENT_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

function paymentProofType(file: File) {
  if (PAYMENT_PROOF_TYPES.has(file.type)) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
    : extension === 'png' ? 'image/png'
      : extension === 'webp' ? 'image/webp'
        : extension === 'pdf' ? 'application/pdf'
          : ''
}

export function paymentProofAccept() {
  return Array.from(PAYMENT_PROOF_TYPES).join(',')
}

export function paymentProofHelpText() {
  return 'ภาพไม่เกิน 12MB (ย่ออัตโนมัติ) หรือ PDF ไม่เกิน 750KB'
}

function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์หลักฐานไม่สำเร็จ'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(blob)
  })
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

async function optimizeProofImage(file: File) {
  const bitmap = await createImageBitmap(file)
  try {
    for (const maxDimension of [1600, 1280, 1024]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('เบราว์เซอร์ไม่รองรับการย่อภาพ')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.86, 0.74, 0.62, 0.5]) {
        const blob = await canvasBlob(canvas, quality)
        if (blob && blob.size <= MAX_PAYMENT_PROOF_BYTES) return blob
      }
    }
  } finally {
    bitmap.close()
  }
  throw new Error('ไม่สามารถย่อภาพให้ต่ำกว่า 750KB ได้ กรุณาเลือกภาพอื่น')
}

export async function readPaymentProof(file: File): Promise<PaymentProof> {
  const mimeType = paymentProofType(file)
  if (!mimeType) {
    throw new Error('กรุณาแนบหลักฐานเป็น JPG, PNG, WebP หรือ PDF')
  }
  if (mimeType === 'application/pdf' && file.size > MAX_PAYMENT_PROOF_BYTES) {
    throw new Error('ไฟล์ PDF ต้องมีขนาดไม่เกิน 750KB')
  }
  if (file.size > MAX_PAYMENT_PROOF_SOURCE_BYTES) throw new Error('ภาพหลักฐานต้องมีขนาดไม่เกิน 12MB')
  const payload = mimeType !== 'application/pdf' && (file.size > MAX_PAYMENT_PROOF_BYTES || !file.type)
    ? await optimizeProofImage(file)
    : file
  const dataUrl = await blobDataUrl(payload)
  if (!dataUrl.startsWith('data:')) throw new Error('ไฟล์หลักฐานไม่ถูกต้อง')
  const name = payload === file ? file.name : `${file.name.replace(/\.[^.]+$/, '') || 'payment-proof'}.webp`
  return { dataUrl, name }
}
