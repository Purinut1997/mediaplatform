import { ExternalLink, FileText, Mail, MessageCircle, Phone, RotateCcw, ShieldCheck } from 'lucide-react'
import type { SiteSettings } from '../types'

export function RefundSupport({ settings }: { settings: SiteSettings }) {
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
      {settings.commercePolicyText && <p className="border-t border-slate-200 px-5 py-4 text-xs font-semibold leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-6"><strong>นโยบาย:</strong> {settings.commercePolicyText}</p>}
    </section>
  )
}
