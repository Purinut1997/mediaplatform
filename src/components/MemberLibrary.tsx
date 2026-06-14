import { useState, type ReactNode } from 'react'
import {
  AlertCircle,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Heart,
  Loader2,
  LogOut,
  PackageCheck,
  Search,
  Send,
  UserCircle2,
} from 'lucide-react'
import { readJson } from '../lib/api'
import type { CurrentUser, MediaItem, MemberLibrary, SiteSettings, View } from '../types'

export function MemberLibraryPanel({
  currentUser,
  library,
  loading,
  onLogout,
  onOpenDetail,
  onLibraryRefresh,
  onUserUpdated,
  renderFavorite,
  setView,
  settings,
}: {
  currentUser: CurrentUser
  library: MemberLibrary | null
  loading: boolean
  onLogout: () => void
  onOpenDetail: (item: MediaItem) => void
  onLibraryRefresh: () => void
  onUserUpdated: (user: CurrentUser) => void
  renderFavorite: (media: MediaItem) => ReactNode
  setView: (view: View) => void
  settings: SiteSettings
}) {
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '-'
  const favorites = library?.favorites ?? []
  const history = library?.history ?? []
  const purchases = library?.purchases ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="nexus-glass overflow-hidden rounded-[2rem] border backdrop-blur-2xl">
        <div className="grid gap-6 bg-[linear-gradient(125deg,#081427,#0d2941_60%,#0e7490)] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
              <BookmarkCheck size={18} />
              Member Library
            </p>
            <h1 className="mt-5 text-3xl font-black sm:text-4xl">คลังของฉัน</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-sky-100/75">
              รวมสื่อที่บันทึกไว้และประวัติดาวน์โหลดของบัญชีเดียว ค้นของที่เคยใช้ต่อได้ทันที
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950" onClick={() => setView('media')} type="button">
              <Search size={19} />
              เลือกดูสื่อเพิ่ม
            </button>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 font-black text-white" onClick={onLogout} type="button">
              <LogOut size={19} />
              ออกจากระบบ
            </button>
          </div>
        </div>

        <MembershipUpgradePanel
          currentUser={currentUser}
          library={library}
          onLibraryRefresh={onLibraryRefresh}
          settings={settings}
        />

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-black/20">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950">
                <UserCircle2 size={30} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-950 dark:text-white">{library?.profile.name ?? currentUser.name}</p>
                <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{library?.profile.email ?? currentUser.email}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['สิทธิ์', currentUser.access],
                ['รายการโปรด', `${favorites.length} รายการ`],
                ['เคยดาวน์โหลด', `${history.length} สื่อ`],
                ['ซื้อแยก', `${purchases.length} สื่อ`],
              ].map(([label, value]) => (
                <div className="rounded-2xl bg-slate-100/80 p-4 dark:bg-white/[0.06]" key={label}>
                  <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                  <p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-black/20">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
              <Clock3 className="text-cyan-600 dark:text-cyan-300" />
              ดาวน์โหลดล่าสุด
            </h2>
            {loading ? (
              <div className="mt-5 flex min-h-32 items-center justify-center gap-3 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                กำลังโหลดประวัติ
              </div>
            ) : history.length ? (
              <div className="mt-4 space-y-3">
                {history.slice(0, 4).map((entry) => (
                  <button className="grid min-h-20 w-full grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.04]" key={entry.media.id} onClick={() => onOpenDetail(entry.media)} type="button">
                    <img alt="" className="h-16 w-16 rounded-xl object-cover" src={entry.media.cover} />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-black text-slate-950 dark:text-white">{entry.media.title}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-400">{formatDate(entry.lastDownloadedAt)}</span>
                    </span>
                    <span className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{entry.downloadCount} ครั้ง</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid min-h-32 place-items-center rounded-2xl border border-dashed border-slate-300 p-5 text-center font-bold text-slate-500 dark:border-white/10">
                ยังไม่มีประวัติดาวน์โหลด
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountSecurity currentUser={currentUser} onLogout={onLogout} onUserUpdated={onUserUpdated} />

      {purchases.length > 0 && (
        <section className="mt-8 rounded-3xl border border-amber-200/80 bg-amber-50/75 p-5 shadow-lg backdrop-blur dark:border-amber-300/15 dark:bg-amber-300/[0.06]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-200">
                <PackageCheck size={18} />
                PURCHASED MEDIA
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">สื่อที่ซื้อไว้</h2>
            </div>
            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950 dark:bg-amber-300/15 dark:text-amber-100">
              {purchases.length.toLocaleString('th-TH')} รายการ
            </span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {purchases.map(({ media, purchasedAt, amount }) => (
              <button className="grid min-h-24 w-full grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-amber-200 bg-white/80 p-3 text-left transition hover:border-amber-400 dark:border-white/10 dark:bg-white/[0.04]" key={media.id} onClick={() => onOpenDetail(media)} type="button">
                <img alt="" className="h-[72px] w-[72px] rounded-xl object-cover" src={media.cover} />
                <span className="min-w-0">
                  <span className="line-clamp-2 font-black text-slate-950 dark:text-white">{media.title}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-400">{formatDate(purchasedAt)}</span>
                </span>
                <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-900 dark:bg-amber-300/10 dark:text-amber-100">
                  {amount.toLocaleString('th-TH')} บาท
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-200">
            <Heart className="fill-current" size={17} />
            SAVED MEDIA
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">สื่อที่บันทึกไว้</h2>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">กดหัวใจบนการ์ดเพื่อนำออกจากรายการโปรด</p>
      </div>

      {loading ? (
        <div className="mt-6 grid min-h-56 place-items-center rounded-3xl border border-white/70 bg-white/70 font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.05]">
          <Loader2 className="mb-3 animate-spin text-cyan-500" size={28} />
          กำลังโหลดคลังของฉัน
        </div>
      ) : favorites.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{favorites.map(({ media }) => renderFavorite(media))}</div>
      ) : (
        <div className="mt-6 grid min-h-56 place-items-center rounded-3xl border border-dashed border-cyan-300 bg-white/65 p-6 text-center dark:border-cyan-300/20 dark:bg-white/[0.04]">
          <div>
            <Heart className="mx-auto text-cyan-500" size={36} />
            <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">ยังไม่มีสื่อที่บันทึกไว้</h3>
            <p className="mt-2 font-semibold text-slate-500 dark:text-slate-400">เปิดรายละเอียดสื่อแล้วกด “เก็บไว้ในคลังของฉัน”</p>
          </div>
        </div>
      )}
    </section>
  )
}

function MembershipUpgradePanel({
  currentUser,
  library,
  onLibraryRefresh,
  settings,
}: {
  currentUser: CurrentUser
  library: MemberLibrary | null
  onLibraryRefresh: () => void
  settings: SiteSettings
}) {
  const [phone, setPhone] = useState('')
  const [slipName, setSlipName] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const request = library?.vipRequest
  const vipExpiresAt = library?.profile.vipExpiresAt ?? currentUser.vipExpiresAt
  const formatDate = (value?: string | null) =>
    value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date(value)) : 'ไม่กำหนดวันหมดอายุ'

  const submitRequest = async () => {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch('/api/member/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, slipName, agreementAccepted: agree }),
      })
      const result = await readJson<{ ok?: boolean; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'ส่งคำขอ VIP ไม่สำเร็จ')
      setNotice('ส่งคำขอ VIP แล้ว ผู้ดูแลจะตรวจสอบและอัปเดตสถานะในหน้านี้')
      setPhone('')
      setSlipName('')
      setAgree(false)
      onLibraryRefresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'ส่งคำขอ VIP ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  if (currentUser.access === 'VIP') {
    return (
      <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-amber-300/60 bg-[linear-gradient(135deg,rgba(255,251,235,.96),rgba(254,243,199,.88))] p-5 shadow-lg shadow-amber-500/10 dark:border-amber-300/20 dark:bg-[linear-gradient(135deg,rgba(120,53,15,.22),rgba(15,23,42,.75))] sm:mx-6 sm:mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20">
              <Crown size={30} />
            </div>
            <div>
              <p className="font-black text-amber-700 dark:text-amber-200">VIP ACTIVE</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">บัญชีของคุณเปิดใช้สิทธิ์ VIP แล้ว</h2>
              <p className="mt-1 font-semibold text-slate-600 dark:text-slate-300">เข้าถึงสื่อสมาชิกและชุดความรู้ขั้นสูงได้ทันที</p>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-300/60 bg-white/70 px-5 py-3 dark:border-amber-300/20 dark:bg-white/[0.06]">
            <p className="inline-flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-200"><CalendarDays size={16} />วันหมดอายุ</p>
            <p className="mt-1 font-black text-slate-950 dark:text-white">{formatDate(vipExpiresAt)}</p>
          </div>
        </div>
      </section>
    )
  }

  if (request?.status === 'pending' || request?.status === 'approved') {
    const approved = request.status === 'approved'
    return (
      <section className="mx-4 mt-4 rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 dark:border-cyan-300/20 dark:bg-cyan-300/[0.07] sm:mx-6 sm:mt-6">
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${approved ? 'bg-emerald-400 text-emerald-950' : 'bg-cyan-400 text-cyan-950'}`}>
            {approved ? <CheckCircle2 size={25} /> : <Clock3 size={25} />}
          </div>
          <div>
            <p className="text-sm font-black text-cyan-700 dark:text-cyan-200">VIP REQUEST #{request.id}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{approved ? 'คำขอ VIP ได้รับการอนุมัติแล้ว' : 'คำขอ VIP กำลังรอตรวจสอบ'}</h2>
            <p className="mt-2 font-semibold leading-7 text-slate-600 dark:text-slate-300">
              {approved ? 'กรุณาโหลดหน้าใหม่อีกครั้งเพื่ออัปเดตสิทธิ์บัญชี' : `ผู้ดูแลจะตรวจสอบภายในประมาณ ${settings.paymentReviewHours.toLocaleString('th-TH')} ชั่วโมง ไม่ต้องส่งคำขอซ้ำ`}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-violet-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,.9),rgba(245,243,255,.86))] shadow-lg shadow-violet-500/10 dark:border-violet-300/20 dark:bg-[linear-gradient(135deg,rgba(76,29,149,.16),rgba(8,20,39,.78))] sm:mx-6 sm:mt-6">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.15fr] lg:p-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800 dark:bg-violet-300/10 dark:text-violet-200">
            <Crown size={15} />
            UPGRADE TO VIP
          </p>
          <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">ปลดล็อกคลังสื่อขั้นสูงภายหลังได้ทุกเมื่อ</h2>
          <p className="mt-2 font-semibold leading-7 text-slate-600 dark:text-slate-300">
            ส่งคำขอจากบัญชีสมาชิกเดิม ประวัติและรายการโปรดทั้งหมดจะยังอยู่ครบ
          </p>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={17} />เข้าถึงสื่อสมาชิกและ VIP</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={17} />อายุสิทธิ์ {settings.vipDurationDays.toLocaleString('th-TH')} วันหลังอนุมัติ</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={17} />ติดตามสถานะคำขอได้จากหน้านี้</p>
          </div>
          {request?.status === 'rejected' && (
            <p className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              คำขอก่อนหน้าถูกปฏิเสธ คุณสามารถตรวจข้อมูลและส่งคำขอใหม่ได้
            </p>
          )}
        </div>

        {settings.vipRegistrationEnabled ? (
          <div className="rounded-3xl border border-violet-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
              {settings.vipQrUrl ? (
                <img alt="QR Code สมัคร VIP" className="h-28 w-28 rounded-2xl border border-slate-200 bg-white object-contain p-2" src={settings.vipQrUrl} />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-2xl border border-dashed border-violet-300 bg-violet-50 text-center text-xs font-black text-violet-500 dark:bg-white/[0.04]">รอ QR Code</div>
              )}
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                <p className="text-lg font-black text-slate-950 dark:text-white">{settings.vipPaymentTitle}</p>
                <p className="mt-1">{settings.vipBankName}</p>
                {settings.vipAccountNumber && <p>เลขบัญชี: {settings.vipAccountNumber}</p>}
                <p>ชื่อบัญชี: {settings.vipAccountName}</p>
                <p className="mt-2 text-xl font-black text-violet-700 dark:text-violet-200">
                  {settings.vipPrice > 0 ? `${settings.vipPrice.toLocaleString('th-TH')} บาท` : 'รอผู้ดูแลแจ้งยอด'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setPhone(event.target.value)} placeholder="เบอร์โทรศัพท์ (ถ้ามี)" value={phone} />
              <label className="flex min-h-12 cursor-pointer items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                <span className="truncate">{slipName || settings.vipSlipLabel}</span>
                <input className="hidden" onChange={(event) => setSlipName(event.target.files?.[0]?.name ?? '')} type="file" />
              </label>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              <input checked={agree} className="mt-1 h-4 w-4" onChange={(event) => setAgree(event.target.checked)} type="checkbox" />
              {settings.vipAgreementLabel}
            </label>
            {notice && <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-sm font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">{notice}</p>}
            <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 px-5 font-black text-white shadow-lg shadow-violet-500/20 disabled:opacity-60" disabled={busy || !agree} onClick={() => void submitRequest()} type="button">
              {busy ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
              ส่งคำขอสมัคร VIP
            </button>
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/55 p-6 text-center dark:border-white/15 dark:bg-white/[0.04]">
            <div>
              <Clock3 className="mx-auto text-violet-500" size={32} />
              <p className="mt-3 text-lg font-black text-slate-950 dark:text-white">ยังไม่เปิดรับสมัคร VIP</p>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">เมื่อผู้ดูแลเปิดรับสมัคร ข้อมูลและปุ่มส่งคำขอจะแสดงที่นี่อัตโนมัติ</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function AccountSecurity({
  currentUser,
  onLogout,
  onUserUpdated,
}: {
  currentUser: CurrentUser
  onLogout: () => void
  onUserUpdated: (user: CurrentUser) => void
}) {
  const [name, setName] = useState(currentUser.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const updateAccount = async (body: Record<string, string>) => {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch('/api/member/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const result = await readJson<{ user?: CurrentUser; signedOut?: boolean; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'จัดการบัญชีไม่สำเร็จ')
      if (result.user) onUserUpdated(result.user)
      if (result.signedOut) {
        onLogout()
        return
      }
      setNotice('บันทึกข้อมูลบัญชีเรียบร้อย')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'จัดการบัญชีไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      <form className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.05]" onSubmit={(event) => { event.preventDefault(); void updateAccount({ action: 'profile', name }) }}>
        <h2 className="text-xl font-black text-slate-950 dark:text-white">ข้อมูลบัญชี</h2>
        <label className="mt-4 block text-sm font-black text-slate-600 dark:text-slate-300">
          ชื่อที่แสดง
          <input autoComplete="name" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="name" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <button className="mt-4 min-h-12 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950 disabled:opacity-60" disabled={busy} type="submit">บันทึกชื่อ</button>
      </form>
      <form className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.05]" onSubmit={(event) => { event.preventDefault(); void updateAccount({ action: 'password', currentPassword, newPassword }) }}>
        <h2 className="text-xl font-black text-slate-950 dark:text-white">ความปลอดภัย</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input autoComplete="current-password" className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="current-password" onChange={(event) => setCurrentPassword(event.target.value)} placeholder="รหัสผ่านปัจจุบัน" type="password" value={currentPassword} />
          <input autoComplete="new-password" className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="new-password" onChange={(event) => setNewPassword(event.target.value)} placeholder="รหัสผ่านใหม่ 10 ตัวขึ้นไป" type="password" value={newPassword} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="min-h-12 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 disabled:opacity-60 dark:bg-cyan-300 dark:text-slate-950" disabled={busy} type="submit">เปลี่ยนรหัสผ่าน</button>
          <button className="min-h-12 rounded-2xl border border-red-200 px-5 font-black text-red-600 disabled:opacity-60 dark:border-red-400/20 dark:text-red-300" disabled={busy} onClick={() => void updateAccount({ action: 'logoutAll' })} type="button">ออกจากระบบทุกอุปกรณ์</button>
        </div>
      </form>
      {notice && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 font-bold text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100 lg:col-span-2">{notice}</div>}
    </section>
  )
}
