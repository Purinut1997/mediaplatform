import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Download, ExternalLink, Eye, FileText, Heart, ImageIcon, LockKeyhole, Maximize2, PlayCircle, Send, Star, X } from 'lucide-react'
import { readJson } from '../lib/api'
import { canViewAccess, getImageDisplayUrl, isPreviewImageUrl, normalizeAssetUrl } from '../lib/media'
import { paymentProofAccept, paymentProofHelpText, readPaymentProof } from '../lib/payment-proof'
import type { CurrentUser, MediaIssueReport, MediaItem, SiteSettings } from '../types'

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
  const coverUrl = normalizeAssetUrl(item.cover)
  const primaryLink = item.links?.find((link) => link.type !== 'Preview Image' && canViewAccess(currentUser, link.access) && link.url) ?? item.links?.find((link) => link.type !== 'Preview Image')
  const resourceLinks = useMemo(() => item.links?.filter((link) => link.type !== 'Preview Image') ?? [], [item.links])
  const previewImages = useMemo(() => {
    const fromLinks = (item.links ?? [])
      .map((link) => {
        const rawUrl = link.previewUrl || link.url
        const isPreviewImage = link.type === 'Preview Image' || isPreviewImageUrl(rawUrl)
        return isPreviewImage && rawUrl
          ? {
              access: link.access,
              label: link.label || 'ภาพตัวอย่างระบบ',
              openUrl: normalizeAssetUrl(rawUrl),
              url: getImageDisplayUrl(rawUrl),
            }
          : null
      })
      .filter(Boolean) as Array<{ access: string; label: string; openUrl: string; url: string }>
    if (!fromLinks.length && item.previewUrl && isPreviewImageUrl(item.previewUrl)) {
      fromLinks.push({ access: item.access, label: 'ภาพตัวอย่างระบบ', openUrl: normalizeAssetUrl(item.previewUrl), url: getImageDisplayUrl(item.previewUrl) })
    }
    return fromLinks
  }, [item.access, item.links, item.previewUrl])
  const [failedCoverUrl, setFailedCoverUrl] = useState('')
  const coverFailed = Boolean(coverUrl && failedCoverUrl === coverUrl)
  const [purchaseSlipName, setPurchaseSlipName] = useState('')
  const [purchaseSlipDataUrl, setPurchaseSlipDataUrl] = useState('')
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
    if (!purchaseSlipDataUrl) {
      setPurchaseNotice('กรุณาแนบหลักฐานการชำระเงินก่อนส่งคำขอซื้อ')
      return
    }
    setRequestingPurchase(true)
    setPurchaseNotice('')
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediaId: item.id, slipName: purchaseSlipName, slipDataUrl: purchaseSlipDataUrl }),
      })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'ส่งคำขอซื้อไม่สำเร็จ')
      setPurchaseNotice('ส่งคำขอซื้อแล้ว ผู้ดูแลจะตรวจสอบและเปิดสิทธิ์ให้บัญชีนี้')
      setPurchaseSlipName('')
      setPurchaseSlipDataUrl('')
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

      <div className="nexus-glass grid gap-6 overflow-hidden rounded-[2rem] border p-4 backdrop-blur-xl lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative grid min-h-[22rem] place-items-center overflow-hidden rounded-3xl border border-cyan-300/15 bg-slate-950/40 p-4 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.24),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,.18),transparent_30%)]" />
          {!coverFailed && coverUrl ? (
            <img
              alt={item.title}
              className="relative max-h-[32rem] w-full rounded-[1.5rem] object-contain shadow-2xl shadow-cyan-950/40"
              onError={() => setFailedCoverUrl(coverUrl)}
              src={coverUrl}
            />
          ) : (
            <div className="relative grid w-full max-w-sm place-items-center rounded-[1.5rem] border border-dashed border-cyan-300/30 bg-white/8 p-8 text-center text-cyan-100">
              <ImageIcon className="mb-3 text-cyan-300" size={44} />
              <p className="text-lg font-black">ยังแสดงหน้าปกไม่ได้</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">ระบบรองรับลิงก์ภาพตรง หรือ GitHub blob ที่แปลงเป็น raw ได้อัตโนมัติ</p>
              {item.cover && <a className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950" href={normalizeAssetUrl(item.cover)} rel="noreferrer" target="_blank"><ExternalLink size={16} />เปิดรูปต้นฉบับ</a>}
            </div>
          )}
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
                    <input accept={paymentProofAccept()} className="min-h-11 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/10" onChange={(event) => { const file = event.target.files?.[0]; setPurchaseNotice(''); setPurchaseSlipName(''); setPurchaseSlipDataUrl(''); if (file) void readPaymentProof(file).then((proof) => { setPurchaseSlipName(proof.name); setPurchaseSlipDataUrl(proof.dataUrl) }).catch((error) => setPurchaseNotice(error instanceof Error ? error.message : 'แนบหลักฐานไม่สำเร็จ')) }} type="file" />
                    <button className="min-h-11 rounded-xl bg-amber-400 px-4 font-black text-slate-950 disabled:opacity-60" disabled={requestingPurchase || !currentUser || !purchaseSlipDataUrl} onClick={() => void requestPurchase()} type="button">
                      {currentUser ? (requestingPurchase ? 'กำลังส่ง...' : 'ส่งคำขอซื้อ') : 'เข้าสู่ระบบเพื่อซื้อ'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-bold text-amber-800/80 dark:text-amber-100/70">{purchaseSlipDataUrl ? `แนบแล้ว: ${purchaseSlipName}` : `ต้องแนบหลักฐาน ${paymentProofHelpText()}`}</p>
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

      {Boolean(resourceLinks.length) && (
        <section className="nexus-glass mt-6 rounded-3xl border p-6 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">ไฟล์และบทเรียนในชุดนี้</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">เลือกเปิดเอกสาร วิดีโอ หรือลิงก์ที่ต้องการได้โดยตรง</p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{resourceLinks.length} รายการ</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {resourceLinks.map((link, index) => {
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

      <section className="nexus-glass mt-6 rounded-[2rem] border p-4 backdrop-blur sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="inline-flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white"><PlayCircle className="text-violet-600" />Preview ระบบ</h3>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">แกลเลอรีภาพตัวอย่าง หน้าจอ หรือเดโมระบบ ไม่แสดง Sheet/ไฟล์จริงในส่วนนี้</p>
          </div>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{previewImages.length} ภาพ</span>
        </div>
        {previewImages.length ? <SystemPreviewGallery images={previewImages} /> : <PreviewFallback />}
      </section>

      <section className="nexus-glass mt-6 rounded-3xl border p-6 backdrop-blur">
        <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black"><FileText className="text-cyan-600" />รายละเอียดสื่อ</h3>
        <ul className="space-y-3 text-slate-600 dark:text-slate-300">
          <li>รองรับการแปะลิงก์ Google Drive, Google Sheet, YouTube และลิงก์ภายนอก</li>
          <li>ส่วน Preview ใช้ภาพชนิด `Preview Image` เพื่อโชว์หน้าจอระบบหรือภาพขายโดยเฉพาะ</li>
          <li>ระบบจะเช็กสิทธิ์ก่อนแสดงปุ่มดาวน์โหลดจริงในขั้นตอน backend</li>
        </ul>
      </section>
      <MediaIssuePanel currentUser={currentUser} item={item} />
      <ReviewPanel currentUser={currentUser} mediaId={item.id} />
    </section>
  )
}

function SystemPreviewGallery({
  images,
}: {
  images: Array<{ access: string; label: string; openUrl: string; url: string }>
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const active = images[Math.min(activeIndex, images.length - 1)] ?? images[0]
  const go = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + images.length) % images.length)
  }

  return (
    <>
      <div className="overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-slate-950/70 p-3 shadow-2xl shadow-cyan-950/20">
        <div className="group relative overflow-hidden rounded-2xl bg-slate-950">
          <button className="block h-[26rem] w-full text-left sm:h-[34rem] lg:h-[40rem]" onClick={() => setExpanded(true)} type="button">
            <img alt={active.label} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.01]" src={active.url} />
            <span className="absolute left-3 top-3 rounded-full bg-slate-950/82 px-3 py-1 text-sm font-black text-white shadow-xl backdrop-blur">{activeIndex + 1} / {images.length}</span>
            <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-slate-950/78 px-4 py-2 text-xs font-black text-cyan-100 shadow-lg backdrop-blur"><Maximize2 size={14} />แตะเพื่อขยาย</span>
          </button>
          {images.length > 1 && (
            <>
              <button aria-label="ภาพก่อนหน้า" className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-slate-950/62 text-white shadow-xl backdrop-blur transition hover:bg-cyan-300 hover:text-slate-950" onClick={() => go(-1)} type="button"><ChevronLeft size={24} /></button>
              <button aria-label="ภาพถัดไป" className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-slate-950/62 text-white shadow-xl backdrop-blur transition hover:bg-cyan-300 hover:text-slate-950" onClick={() => go(1)} type="button"><ChevronRight size={24} /></button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button className={`h-16 w-28 shrink-0 overflow-hidden rounded-xl border bg-slate-950 p-1 transition sm:h-20 sm:w-36 ${index === activeIndex ? 'border-cyan-300 shadow-lg shadow-cyan-500/20' : 'border-white/10 opacity-70 hover:opacity-100'}`} key={`${image.url}-${index}`} onClick={() => setActiveIndex(index)} type="button">
                <img alt={image.label} className="h-full w-full rounded-lg object-cover" src={image.url} />
              </button>
            ))}
          </div>
        )}
      </div>
      {expanded && (
        <div aria-label={`ดูภาพตัวอย่าง ${active.label}`} aria-modal="true" className="fixed inset-0 z-[95] grid place-items-center bg-slate-950/88 p-4 backdrop-blur-xl" role="dialog">
          <button aria-label="ปิดภาพตัวอย่าง" className="absolute inset-0 cursor-default" onClick={() => setExpanded(false)} type="button" />
          <div className="relative w-full max-w-6xl">
            <button aria-label="ปิด" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950/80 text-white shadow-xl" onClick={() => setExpanded(false)} type="button"><X size={20} /></button>
            {images.length > 1 && <button aria-label="ภาพก่อนหน้า" className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-slate-950/80 text-white shadow-xl" onClick={() => go(-1)} type="button"><ChevronLeft size={24} /></button>}
            {images.length > 1 && <button aria-label="ภาพถัดไป" className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-slate-950/80 text-white shadow-xl" onClick={() => go(1)} type="button"><ChevronRight size={24} /></button>}
            <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-3 shadow-2xl">
              <img alt={active.label} className="max-h-[82vh] w-full rounded-[1.5rem] object-contain" src={active.url} />
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-sm font-bold text-slate-300">
                <span>{active.label}</span>
                <a className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-3 text-slate-950" href={active.openUrl} rel="noreferrer" target="_blank"><ExternalLink size={16} />เปิดรูปต้นฉบับ</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PreviewFallback() {
  return (
    <div className="grid min-h-80 place-items-center rounded-[1.75rem] border border-dashed border-cyan-300/25 bg-slate-950/45 p-8 text-center text-slate-300">
      <div>
        <ImageIcon className="mx-auto mb-3 text-cyan-300" size={48} />
        <p className="text-xl font-black text-white">ยังไม่มีภาพ Preview ระบบ</p>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-400">เพิ่มลิงก์ชนิด <span className="font-black text-cyan-200">Preview Image</span> จากหลังบ้าน เพื่อโชว์ภาพหน้าจอระบบแบบแกลเลอรี ไม่ใช้ Sheet หรือไฟล์จริงเป็นตัวอย่าง</p>
      </div>
    </div>
  )
}

function MediaIssuePanel({ currentUser, item }: { currentUser: CurrentUser | null; item: MediaItem }) {
  const [issueType, setIssueType] = useState<MediaIssueReport['issueType']>('broken_link')
  const [detail, setDetail] = useState('')
  const [contact, setContact] = useState('')
  const [issues, setIssues] = useState<MediaIssueReport[]>([])
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const loadIssues = () => {
    if (!currentUser) return setIssues([])
    void fetch('/api/media/issues', { credentials: 'include' })
      .then((response) => readJson<{ issues?: MediaIssueReport[] }>(response))
      .then((result) => setIssues((result.issues ?? []).filter((issue) => issue.mediaId === item.id)))
      .catch(() => setIssues([]))
  }
  useEffect(() => {
    if (!currentUser) return
    let active = true
    void fetch('/api/media/issues', { credentials: 'include' })
      .then((response) => readJson<{ issues?: MediaIssueReport[] }>(response))
      .then((result) => { if (active) setIssues((result.issues ?? []).filter((issue) => issue.mediaId === item.id)) })
      .catch(() => { if (active) setIssues([]) })
    return () => { active = false }
  }, [currentUser, item.id])
  const submit = async () => {
    if (!currentUser) return setNotice('กรุณาเข้าสู่ระบบก่อนแจ้งปัญหา')
    setSending(true)
    setNotice('')
    try {
      const response = await fetch('/api/media/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ mediaId: item.id, issueType, detail, contact }) })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'ส่งรายงานไม่สำเร็จ')
      setDetail('')
      setContact('')
      setNotice('ส่งรายงานแล้ว ผู้ดูแลจะตรวจสอบและอัปเดตสถานะในหน้านี้')
      loadIssues()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'ส่งรายงานไม่สำเร็จ')
    } finally {
      setSending(false)
    }
  }
  const statusLabel = { pending: 'รอตรวจสอบ', reviewing: 'กำลังตรวจสอบ', resolved: 'แก้ไขแล้ว', rejected: 'ปิดรายงาน' }
  return (
    <section className="nexus-glass mt-6 rounded-3xl border p-5 backdrop-blur sm:p-6">
      <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white"><AlertTriangle className="text-amber-500" />แจ้งปัญหาสื่อนี้</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">แจ้งไฟล์เสีย เนื้อหาผิด หรือข้อกังวลด้านลิขสิทธิ์ พร้อมติดตามผลได้ในหน้าเดิม</p>
      {currentUser ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" onChange={(event) => setIssueType(event.target.value as MediaIssueReport['issueType'])} value={issueType}><option value="broken_link">ลิงก์หรือไฟล์เปิดไม่ได้</option><option value="incorrect_content">ข้อมูลหรือเนื้อหาไม่ถูกต้อง</option><option value="copyright">ลิขสิทธิ์หรือความเหมาะสม</option><option value="other">ปัญหาอื่น</option></select>
        <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/10" maxLength={160} onChange={(event) => setContact(event.target.value)} placeholder="ช่องทางติดต่อกลับ (ไม่บังคับ)" value={contact} />
        <textarea className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/10" maxLength={1500} onChange={(event) => setDetail(event.target.value)} placeholder="อธิบายปัญหาอย่างน้อย 10 ตัวอักษร" value={detail} />
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 font-black text-slate-950 disabled:opacity-50 sm:col-span-2 sm:justify-self-start" disabled={sending || detail.trim().length < 10} onClick={() => void submit()} type="button"><Send size={18} />{sending ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}</button>
      </div> : <p className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900 dark:bg-amber-300/10 dark:text-amber-100">เข้าสู่ระบบเพื่อแจ้งและติดตามปัญหา</p>}
      {notice && <p className="mt-3 text-sm font-bold text-amber-700 dark:text-amber-200">{notice}</p>}
      {issues.length > 0 && <div className="mt-5 grid gap-3"><p className="font-black text-slate-950 dark:text-white">ประวัติรายงานของคุณ</p>{issues.map((issue) => <article className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]" key={issue.id}><div className="flex flex-wrap items-center justify-between gap-2"><strong>รายงาน #{issue.id}</strong><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 dark:bg-amber-300/10 dark:text-amber-100">{statusLabel[issue.status]}</span></div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{issue.detail}</p>{issue.adminNote && <p className="mt-2 text-sm font-bold text-cyan-700 dark:text-cyan-200">ผู้ดูแล: {issue.adminNote}</p>}</article>)}</div>}
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
    <section className="nexus-glass mt-6 rounded-3xl border p-5 backdrop-blur sm:p-6">
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
