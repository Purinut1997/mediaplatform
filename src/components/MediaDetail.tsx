import { useEffect, useState } from 'react'
import { Download, ExternalLink, Eye, FileText, Heart, LockKeyhole, PlayCircle, Star } from 'lucide-react'
import { readJson } from '../lib/api'
import { canViewAccess, getPreviewUrl } from '../lib/media'
import type { CurrentUser, MediaItem, SiteSettings } from '../types'

export function MediaDetail({
  canDownload,
  currentUser,
  isFavorite,
  item,
  settings,
  onBack,
  onDownloaded,
  onError,
  onFavorite,
}: {
  canDownload: boolean
  currentUser: CurrentUser | null
  isFavorite: boolean
  item: MediaItem
  settings: SiteSettings
  onBack: () => void
  onDownloaded: () => void
  onError: () => void
  onFavorite: () => void
}) {
  const previewUrl = getPreviewUrl(item)
  const primaryLink = item.links?.find((link) => canViewAccess(currentUser, link.access) && link.url) ?? item.links?.[0]
  const [purchaseSlipName, setPurchaseSlipName] = useState('')
  const [purchaseNotice, setPurchaseNotice] = useState('')
  const [requestingPurchase, setRequestingPurchase] = useState(false)
  const canCheckPurchasedAccess = item.access === 'ซื้อแยก' && Boolean(currentUser)
  const purchaseAvailable = settings.purchaseEnabled && item.price > 0

  const openResource = async (linkId?: number, allowed = canDownload) => {
    if (!allowed) return onError()
    try {
      const response = await fetch('/api/media/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediaId: item.id, linkId }),
      })
      const result = await readJson<{ url?: string; error?: string }>(response)
      if (!response.ok || !result.url) throw new Error(result.error || 'เปิดลิงก์ไม่สำเร็จ')
      window.open(result.url, '_blank', 'noopener,noreferrer')
      onDownloaded()
    } catch {
      onError()
    }
  }

  const requestPurchase = async () => {
    if (!currentUser) return onError()
    setRequestingPurchase(true)
    setPurchaseNotice('')
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediaId: item.id, slipName: purchaseSlipName }),
      })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'ส่งคำขอซื้อไม่สำเร็จ')
      setPurchaseNotice('ส่งคำขอซื้อแล้ว ผู้ดูแลจะตรวจสอบและเปิดสิทธิ์ให้บัญชีนี้')
    } catch (error) {
      setPurchaseNotice(error instanceof Error ? error.message : 'ส่งคำขอซื้อไม่สำเร็จ')
    } finally {
      setRequestingPurchase(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/70 bg-white/78 px-4 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={onBack} type="button">
        กลับไปคลังสื่อ
      </button>

      <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:grid-cols-[.95fr_1.05fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
          <img alt={item.title} className="h-full min-h-80 w-full object-cover" src={item.cover} />
        </div>
        <div className="p-2 sm:p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-xl bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-200">{item.topic}</span>
            <span className="rounded-xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">{item.access}</span>
            {item.tags?.slice(0, 4).map((tag) => <span className="rounded-xl bg-sky-50 px-3 py-1 text-sm font-black text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" key={tag}>#{tag}</span>)}
          </div>
          <h2 className="text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">{item.title}</h2>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">{item.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoTile icon={Eye} label="เข้าชม" value={`${item.views} ครั้ง`} />
            <InfoTile icon={Download} label="ดาวน์โหลด" value={`${item.downloads} ครั้ง`} />
            <InfoTile icon={FileText} label="แหล่งไฟล์" value={item.source} />
            <InfoTile icon={LockKeyhole} label="ระดับสิทธิ์" value={item.access} />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20" onClick={() => void openResource(primaryLink?.id, (canDownload && (!primaryLink || canViewAccess(currentUser, primaryLink.access))) || canCheckPurchasedAccess)} type="button">
              <Download size={20} />ดาวน์โหลด / เปิดลิงก์
            </button>
            <button className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 font-black shadow-lg transition ${isFavorite ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-950 text-cyan-200 shadow-slate-900/10 dark:bg-cyan-300 dark:text-slate-950'}`} onClick={onFavorite} type="button">
              <Heart className={isFavorite ? 'fill-current' : ''} size={20} />
              {isFavorite ? 'บันทึกในคลังของฉันแล้ว' : 'เก็บไว้ในคลังของฉัน'}
            </button>
          </div>
          {item.access === 'ซื้อแยก' && !canDownload && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/20 dark:bg-amber-300/10">
              <p className="font-black text-amber-900 dark:text-amber-100">
                {purchaseAvailable ? `ซื้อสิทธิ์สื่อนี้ ${item.price.toLocaleString('th-TH')} บาท` : 'สื่อนี้ยังไม่เปิดจำหน่าย'}
              </p>
              {purchaseAvailable ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-amber-800/80 dark:text-amber-100/70">
                    ชำระเงินแล้วแนบสลิป ผู้ดูแลจะตรวจสอบภายในประมาณ {settings.paymentReviewHours.toLocaleString('th-TH')} ชั่วโมง
                  </p>
                  {(settings.vipQrUrl || settings.vipAccountNumber) && (
                    <div className="mt-3 grid gap-3 rounded-2xl bg-white/70 p-3 sm:grid-cols-[auto_1fr] dark:bg-black/20">
                      {settings.vipQrUrl && <img alt="QR Code ชำระเงิน" className="h-28 w-28 rounded-xl bg-white object-contain p-2" src={settings.vipQrUrl} />}
                      <div className="text-sm font-bold leading-6 text-amber-950 dark:text-amber-100">
                        <p>{settings.vipBankName}</p>
                        {settings.vipAccountNumber && <p>เลขบัญชี: {settings.vipAccountNumber}</p>}
                        {settings.vipAccountName && <p>ชื่อบัญชี: {settings.vipAccountName}</p>}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input className="min-h-11 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/10" onChange={(event) => setPurchaseSlipName(event.target.files?.[0]?.name ?? '')} type="file" />
                    <button className="min-h-11 rounded-xl bg-amber-400 px-4 font-black text-slate-950 disabled:opacity-60" disabled={requestingPurchase || !currentUser} onClick={() => void requestPurchase()} type="button">
                      {currentUser ? (requestingPurchase ? 'กำลังส่ง...' : 'ส่งคำขอซื้อ') : 'เข้าสู่ระบบเพื่อซื้อ'}
                    </button>
                  </div>
                  {settings.commercePolicyText && <p className="mt-3 text-xs font-semibold leading-5 text-amber-800/80 dark:text-amber-100/65">{settings.commercePolicyText}</p>}
                </>
              ) : (
                <p className="mt-1 text-sm font-semibold text-amber-800/80 dark:text-amber-100/70">ผู้ดูแลกำลังกำหนดราคาและเงื่อนไข กรุณากลับมาตรวจสอบภายหลัง</p>
              )}
              {purchaseNotice && <p className="mt-3 text-sm font-bold text-amber-900 dark:text-amber-100">{purchaseNotice}</p>}
            </div>
          )}
        </div>
      </div>

      {Boolean(item.links?.length) && (
        <section className="mt-6 rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">ไฟล์และบทเรียนในชุดนี้</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">เลือกเปิดเอกสาร วิดีโอ หรือลิงก์ที่ต้องการได้โดยตรง</p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{item.links?.length ?? 0} รายการ</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {item.links?.map((link, index) => {
              const allowed = (canDownload && canViewAccess(currentUser, link.access)) || canCheckPurchasedAccess
              return (
                <button className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${allowed ? 'border-cyan-200 bg-cyan-50 hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:hover:bg-cyan-300/15' : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'}`} key={link.id ?? `${link.label}-${index}`} onClick={() => void openResource(link.id, allowed)} type="button">
                  {allowed ? <ExternalLink className="shrink-0 text-cyan-600 dark:text-cyan-300" size={21} /> : <LockKeyhole className="shrink-0" size={21} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black text-slate-900 dark:text-white">{link.label}</span>
                    <span className="mt-0.5 block text-xs font-bold">{link.type} · {link.access}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black"><FileText className="text-cyan-600" />รายละเอียดสื่อ</h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li>รองรับการแปะลิงก์ Google Drive, Google Sheet, YouTube และลิงก์ภายนอก</li>
            <li>ทุกการ์ดต้องมีหน้าปกก่อนเผยแพร่ เพื่อให้คลังสื่อดูเป็นมืออาชีพ</li>
            <li>ระบบจะเช็กสิทธิ์ก่อนแสดงปุ่มดาวน์โหลดจริงในขั้นตอน backend</li>
          </ul>
        </section>
        <aside className="rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black"><PlayCircle className="text-violet-600" />Preview</h3>
          {previewUrl ? (
            <iframe className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={previewUrl} title={`preview-${item.title}`} />
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-white/10">
              <ExternalLink className="mb-3" />เพิ่มลิงก์ preview จากหลังบ้านเพื่อแสดง Drive / Sheet / YouTube ตรงนี้
            </div>
          )}
        </aside>
      </div>
      <ReviewPanel currentUser={currentUser} mediaId={item.id} />
    </section>
  )
}

type MediaReview = { id: number; rating: number; comment: string; name: string }

function ReviewPanel({ currentUser, mediaId }: { currentUser: CurrentUser | null; mediaId: number }) {
  const [reviews, setReviews] = useState<MediaReview[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState('')
  const refreshReviews = () => {
    void fetch(`/api/media/reviews?mediaId=${mediaId}`)
      .then((response) => readJson<{ reviews?: MediaReview[] }>(response))
      .then((result) => setReviews(result.reviews ?? []))
      .catch(() => setReviews([]))
  }
  useEffect(refreshReviews, [mediaId])

  return (
    <section className="mt-6 rounded-3xl border border-white/70 bg-white/76 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
      <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white"><Star className="fill-amber-400 text-amber-400" />คะแนนและความคิดเห็น</h3>
      {currentUser ? (
        <form className="mt-5 grid gap-3" onSubmit={async (event) => {
          event.preventDefault()
          const response = await fetch('/api/media/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ mediaId, rating, comment }) })
          const result = await readJson<{ error?: string }>(response)
          setNotice(response.ok ? 'บันทึกคะแนนแล้ว' : result.error || 'บันทึกไม่สำเร็จ')
          if (response.ok) { setComment(''); refreshReviews() }
        }}>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button aria-label={`${value} ดาว`} className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 dark:bg-amber-300/10" key={value} onClick={() => setRating(value)} type="button">
                <Star className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} size={21} />
              </button>
            ))}
          </div>
          <textarea className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" maxLength={500} onChange={(event) => setComment(event.target.value)} placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)" value={comment} />
          <button className="min-h-12 justify-self-start rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" type="submit">ส่งคะแนน</button>
        </form>
      ) : <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">เข้าสู่ระบบเพื่อให้คะแนนสื่อนี้</p>}
      {notice && <p className="mt-3 text-sm font-bold text-cyan-700 dark:text-cyan-200">{notice}</p>}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]" key={review.id}>
            <div className="flex items-center justify-between gap-3"><strong>{review.name}</strong><span className="font-black text-amber-500">{review.rating}/5</span></div>
            {review.comment && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>}
          </article>
        ))}
        {!reviews.length && <p className="text-sm font-bold text-slate-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่ให้คะแนนได้เลย</p>}
      </div>
    </section>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <Icon className="mb-3 text-cyan-600 dark:text-cyan-300" size={24} />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}
