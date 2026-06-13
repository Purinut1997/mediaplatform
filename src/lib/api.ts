export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      response.ok
        ? 'API ส่งข้อมูลกลับมาไม่ถูกต้อง'
        : 'API ยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง',
    )
  }
}
