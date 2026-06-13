import { useState, type ReactNode } from 'react'
import {
  BookmarkCheck,
  Clock3,
  Heart,
  Loader2,
  LogOut,
  Search,
  UserCircle2,
} from 'lucide-react'
import { readJson } from '../lib/api'
import type { CurrentUser, MediaItem, MemberLibrary, View } from '../types'

export function MemberLibraryPanel({
  currentUser,
  library,
  loading,
  onLogout,
  onOpenDetail,
  onUserUpdated,
  renderFavorite,
  setView,
}: {
  currentUser: CurrentUser
  library: MemberLibrary | null
  loading: boolean
  onLogout: () => void
  onOpenDetail: (item: MediaItem) => void
  onUserUpdated: (user: CurrentUser) => void
  renderFavorite: (media: MediaItem) => ReactNode
  setView: (view: View) => void
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
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
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['สิทธิ์', currentUser.access],
                ['รายการโปรด', `${favorites.length} รายการ`],
                ['เคยดาวน์โหลด', `${history.length} สื่อ`],
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
          <button className="min-h-12 rounded-2xl border border-red-200 px-5 font-black text-red-600 dark:border-red-400/20 dark:text-red-300" onClick={() => void updateAccount({ action: 'logoutAll' })} type="button">ออกจากระบบทุกอุปกรณ์</button>
        </div>
      </form>
      {notice && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 font-bold text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100 lg:col-span-2">{notice}</div>}
    </section>
  )
}
