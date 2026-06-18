import { useState } from 'react'
import { FileText, X } from 'lucide-react'
import type { SiteSettings } from '../types'

export function VipTermsDialog({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false)
  const duration = settings.vipLifetimeEnabled
    ? 'ตลอดชีพ'
    : `${settings.vipDurationDays.toLocaleString('th-TH')} วัน`

  return (
    <>
      <button
        className="inline-flex items-center gap-1 font-black text-violet-700 underline decoration-violet-300 underline-offset-4 dark:text-violet-200"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
        type="button"
      >
        <FileText size={15} />
        ดูเงื่อนไข VIP
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            aria-labelledby="vip-terms-title"
            aria-modal="true"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-violet-200 bg-white p-5 text-left shadow-2xl dark:border-violet-300/20 dark:bg-slate-900 sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">VIP TERMS</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white" id="vip-terms-title">เงื่อนไขการสมัครและใช้สิทธิ์ VIP</h2>
              </div>
              <button aria-label="ปิดเงื่อนไข" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white" onClick={() => setOpen(false)} type="button"><X size={20} /></button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <p className="rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-800 dark:bg-violet-300/10 dark:text-violet-100">อายุสิทธิ์: {duration}</p>
              <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-100">ขอคืนเงิน: ภายใน {settings.vipRefundDays.toLocaleString('th-TH')} วัน</p>
              <p className="rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-800 dark:bg-sky-300/10 dark:text-sky-100">ตรวจสอบ: ประมาณ {settings.paymentReviewHours.toLocaleString('th-TH')} ชม.</p>
            </div>
            <div className="mt-5 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">{settings.vipTermsText}</div>
            <button className="mt-5 min-h-12 w-full rounded-2xl bg-violet-600 px-5 font-black text-white" onClick={() => setOpen(false)} type="button">รับทราบเงื่อนไข</button>
          </section>
        </div>
      )}
    </>
  )
}
