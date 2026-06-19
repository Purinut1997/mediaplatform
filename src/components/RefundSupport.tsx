import { useEffect, useState } from 'react'
import { ExternalLink, FileText, Loader2, Mail, MessageCircle, Phone, RotateCcw, ShieldCheck } from 'lucide-react'
import { readJson } from '../lib/api'
import type { RefundRequest, SiteSettings } from '../types'

export function RefundSupport({ settings }: { settings: SiteSettings }) {
  const [requestType, setRequestType] = useState<'vip' | 'media'>('vip')
  const [referenceText, setReferenceText] = useState('')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [contact, setContact] = useState('')
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const loadRequests = async () => {
    const response = await fetch('/api/refunds', { credentials: 'include' })
    const result = await readJson<{ requests?: RefundRequest[] }>(response)
    if (response.ok) setRequests(result.requests ?? [])
  }
  useEffect(() => {
    let active = true
    fetch('/api/refunds', { credentials: 'include' })
      .then(async (response) => ({ response, result: await readJson<{ requests?: RefundRequest[] }>(response) }))
      .then(({ response, result }) => { if (active && response.ok) setRequests(result.requests ?? []) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  const submitRefund = async () => {
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/refunds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ requestType, referenceText, reason, detail, contact }) })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'ส่งคำขอคืนเงินไม่สำเร็จ')
      setNotice('ส่งคำขอคืนเงินแล้ว ผู้ดูแลจะอัปเดตสถานะในหน้านี้')
      setReferenceText(''); setReason(''); setDetail('')
      await loadRequests()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'ส่งคำขอคืนเงินไม่สำเร็จ') } finally { setBusy(false) }
  }

  if (!settings.refundRequestEnabled) return null

  const channels = [
    settings.refundFormUrl && { href: settings.refundFormUrl, icon: FileText, label: 'กรอกแบบฟอร์มขอคืนเงิน', detail: 'ช่องทางหลักสำหรับติดตามข้อมูลครบถ้วน' },
    settings.refundContactEmail && { href: `mailto:${settings.refundContactEmail}?subject=${encodeURIComponent('ขอคืนเงิน - MIKPURINUT Media Platform')}`, icon: Mail, label: 'ส่งอีเมล', detail: settings.refundContactEmail },
    settings.refundLineUrl && { href: settings.refundLineUrl, icon: MessageCircle, label: 'ติดต่อผ่าน LINE', detail: 'เหมาะสำหรับสอบถามสถานะคำขอ' },
    settings.refundContactPhone && { href: `tel:${settings.refundContactPhone.replace(/[^+\d]/g, '')}`, icon: Phone, label: 'โทรศัพท์', detail: settings.refundContactPhone },
  ].filter(Boolean) as Array<{ href: string; icon: typeof FileText; label: string; detail: string }>

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-rose-200/80 bg-white/80 shadow-lg shadow-rose-500/5 backdrop-blur dark:border-rose-300/15 dark:bg-white/[0.05]">
      <div className="grid gap-5 bg-gradient-to-r from-rose-50 to-orange-50 p-5 dark:from-rose-400/10 dark:to-orange-300/5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-200"><RotateCcw size={18} /> REFUND SUPPORT</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{settings.refundContactTitle}</h2>
          <p className="mt-2 max-w-3xl font-semibold leading-7 text-slate-600 dark:text-slate-300">{settings.refundInstructions}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 text-sm font-black text-rose-800 dark:border-rose-300/20 dark:bg-white/[0.06] dark:text-rose-100">
          ตรวจสอบภายในประมาณ {settings.paymentReviewHours.toLocaleString('th-TH')} ชั่วโมง
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h3 className="inline-flex items-center gap-2 font-black text-slate-950 dark:text-white"><ShieldCheck className="text-emerald-500" size={20} />ข้อมูลที่ควรเตรียม</h3>
          <ol className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            <li>1. อีเมลที่ใช้สมัครและประเภทคำขอ: VIP หรือซื้อสื่อแยก</li>
            <li>2. ชื่อรายการ วันที่ชำระเงิน และยอดชำระ</li>
            <li>3. เหตุผลที่ขอคืนเงินพร้อมหลักฐานที่เกี่ยวข้อง</li>
            <li>4. ไม่ต้องส่งรหัสผ่าน เลขบัตร หรือ OTP ให้ผู้ดูแล</li>
          </ol>
          <p className="mt-4 rounded-2xl bg-slate-100 p-3 text-xs font-bold leading-6 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">VIP ขอคืนเงินได้ภายใน {settings.vipRefundDays.toLocaleString('th-TH')} วัน · สื่อซื้อแยกภายใน {settings.purchaseRefundDays.toLocaleString('th-TH')} วัน โดยพิจารณาตามการใช้สิทธิ์จริงและนโยบายที่แสดง</p>
        </div>
        <div>
          <h3 className="font-black text-slate-950 dark:text-white">เลือกช่องทางติดต่อ</h3>
          {channels.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {channels.map(({ href, icon: Icon, label, detail }) => (
                <a className="group flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-rose-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]" href={href} key={label} rel="noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200"><Icon size={21} /></span>
                  <span className="min-w-0"><span className="flex items-center gap-1 font-black text-slate-950 dark:text-white">{label}{href.startsWith('http') && <ExternalLink size={14} />}</span><span className="mt-1 block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</span></span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">ผู้ดูแลกำลังตั้งค่าช่องทางติดต่อ กรุณากลับมาตรวจสอบอีกครั้ง</p>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 p-5 dark:border-white/10 sm:p-6">
        <h3 className="text-xl font-black text-slate-950 dark:text-white">ส่งคำขอผ่านระบบ</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" onChange={(event) => setRequestType(event.target.value as 'vip' | 'media')} value={requestType}><option value="vip">สมาชิก VIP</option><option value="media">ซื้อสื่อแยก</option></select>
          <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" onChange={(event) => setReferenceText(event.target.value)} placeholder="รายการอ้างอิง เช่น VIP #123 หรือชื่อสื่อ" value={referenceText} />
          <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" onChange={(event) => setReason(event.target.value)} placeholder="เหตุผลที่ขอคืนเงิน" value={reason} />
          <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" onChange={(event) => setContact(event.target.value)} placeholder="อีเมลหรือเบอร์โทรติดต่อกลับ" value={contact} />
          <textarea className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10 sm:col-span-2" onChange={(event) => setDetail(event.target.value)} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" value={detail} />
        </div>
        {notice && <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-sm font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">{notice}</p>}
        <button className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-rose-500 px-5 font-black text-white disabled:opacity-50" disabled={busy || referenceText.trim().length < 2 || reason.trim().length < 3 || contact.trim().length < 3} onClick={() => void submitRefund()} type="button">{busy && <Loader2 className="animate-spin" size={18} />}ส่งคำขอคืนเงิน</button>
        {requests.length > 0 && <div className="mt-6 grid gap-2"><h3 className="font-black text-slate-950 dark:text-white">ประวัติคำขอคืนเงิน</h3>{requests.map((request) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10" key={request.id}><div><p className="font-black text-slate-900 dark:text-white">#{request.id} · {request.referenceText}</p><p className="text-xs font-semibold text-slate-500">{new Date(request.createdAt).toLocaleDateString('th-TH')}{request.adminNote ? ` · ${request.adminNote}` : ''}</p></div><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 dark:bg-rose-300/10 dark:text-rose-100">{request.status}</span></article>)}</div>}
      </div>
      {settings.commercePolicyText && <p className="border-t border-slate-200 px-5 py-4 text-xs font-semibold leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-6"><strong>นโยบาย:</strong> {settings.commercePolicyText}</p>}
    </section>
  )
}
