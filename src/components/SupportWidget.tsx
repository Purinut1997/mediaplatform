import { useState } from 'react'
import { CheckCircle2, MessageCircle, Send, X } from 'lucide-react'

const categories = [
  { value: 'general', label: 'สอบถามทั่วไป' },
  { value: 'bug', label: 'พบข้อผิดพลาด' },
  { value: 'account', label: 'บัญชี / การเข้าสู่ระบบ' },
  { value: 'payment', label: 'การชำระเงิน / VIP' },
  { value: 'suggestion', label: 'ข้อเสนอแนะ' },
] as const

type Category = typeof categories[number]['value']

const initialForm = { name: '', email: '', category: 'general' as Category, subject: '', detail: '' }

export function SupportWidget({ pageName }: { pageName: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const pageUrl = typeof window === 'undefined' ? '' : window.location.href

  const toggle = () => {
    setOpen((value) => {
      if (value) {
        setError('')
        setSuccess(false)
      }
      return !value
    })
  }

  const update = (key: keyof typeof initialForm) => (event: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, pageUrl }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setError(data.error || 'ส่งเรื่องแจ้งปัญหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        return
      }
      setSuccess(true)
      setForm(initialForm)
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่')
    } finally {
      setSending(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/40'

  return (
    <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-[90] sm:right-6">
      {open && (
        <section className="mb-3 flex max-h-[min(680px,82dvh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-cyan-300/30 bg-white shadow-2xl shadow-slate-950/45">
          <header className="flex items-start justify-between gap-2 bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-800 px-5 py-4 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">MediaPlatform × ClassCare</p>
              <h2 className="text-lg font-black">ติดต่อผู้ดูแลระบบ</h2>
              <p className="text-xs text-cyan-100">ทีมงานตอบกลับผ่านอีเมลที่แจ้งไว้</p>
            </div>
            <button
              aria-label="ปิดหน้าต่างติดต่อผู้ดูแล"
              className="rounded-full p-1 transition hover:bg-white/15"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="text-emerald-500" size={48} />
                <h3 className="text-base font-black text-slate-900">ส่งเรื่องแจ้งเรียบร้อยแล้ว</h3>
                <p className="text-sm text-slate-600">ขอบคุณที่ติดต่อเรา ทีมงานจะตอบกลับทางอีเมลโดยเร็วที่สุด</p>
                <button
                  className="mt-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                  onClick={() => setSuccess(false)}
                  type="button"
                >
                  ส่งเรื่องใหม่
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-3" onSubmit={submit}>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  ชื่อ
                  <input className={inputClass} maxLength={80} onChange={update('name')} placeholder="ชื่อของคุณ" required value={form.name} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  อีเมล
                  <input className={inputClass} maxLength={254} onChange={update('email')} placeholder="you@example.com" required type="email" value={form.email} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  ประเภทเรื่อง
                  <select className={inputClass} onChange={update('category')} value={form.category}>
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  หัวข้อ
                  <input className={inputClass} maxLength={120} onChange={update('subject')} placeholder="สรุปเรื่องที่ต้องการแจ้ง" required value={form.subject} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  รายละเอียด
                  <textarea className={`${inputClass} min-h-[110px] resize-y`} maxLength={1500} onChange={update('detail')} placeholder="อธิบายรายละเอียด (อย่างน้อย 10 ตัวอักษร)" required value={form.detail} />
                </label>
                <p className="text-[11px] text-slate-500">หน้าที่แจ้ง: {pageName}</p>
                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700" role="alert">{error}</p>
                )}
                <button
                  className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={sending}
                  type="submit"
                >
                  <Send size={16} />
                  {sending ? 'กำลังส่ง...' : 'ส่งเรื่องแจ้ง'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
      <button
        aria-expanded={open}
        aria-label={open ? 'ปิดแชทช่วยเหลือ' : 'ติดต่อผู้ดูแลระบบ'}
        className="group relative ml-auto grid h-15 w-15 place-items-center rounded-full border border-white/30 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 text-white shadow-2xl shadow-sky-900/35 transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
        onClick={toggle}
        type="button"
      >
        <span className="absolute inset-[-6px] -z-10 rounded-full bg-cyan-400/20 blur-md transition group-hover:bg-cyan-300/35" />
        {open ? <X size={25} /> : <MessageCircle fill="currentColor" size={27} />}
      </button>
    </div>
  )
}
