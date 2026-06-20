import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Command,
  Download,
  Eye,
  Flame,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react'
import type { MediaItem } from '../types'

function engagementScore(item: MediaItem) {
  return item.views + item.downloads * 3 + item.rating * 100
}

function metric(value: number) {
  return new Intl.NumberFormat('th-TH', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function DiscoverySpotlight({
  mediaItems,
  openDetail,
  openSearch,
}: {
  mediaItems: MediaItem[]
  openDetail: (item: MediaItem) => void
  openSearch: () => void
}) {
  const ranked = useMemo(
    () => [...mediaItems].sort((a, b) => engagementScore(b) - engagementScore(a)),
    [mediaItems],
  )
  const featured = ranked[0]
  const trending = ranked.slice(0, 3)

  if (!featured) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300">
            <Flame size={17} /> Live Discovery
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">กำลังมาแรงใน Nexus</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">คัดจากยอดเข้าชม ดาวน์โหลด และคะแนนของสื่อในระบบ</p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-5 font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
          onClick={openSearch}
          type="button"
        >
          <Search size={18} /> ค้นหาอัจฉริยะ
          <span className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] text-slate-500 sm:inline-flex dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            <Command size={12} /> K
          </span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="group relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/40 bg-slate-950 shadow-2xl shadow-cyan-950/10">
          <img alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" src={featured.cover} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-cyan-950/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/20 px-3 py-1 text-xs font-black text-fuchsia-100 backdrop-blur-md">SPOTLIGHT</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur-md">{featured.topic}</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur-md">{featured.access}</span>
            </div>
            <h3 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">{featured.title}</h3>
            <p className="mt-3 max-w-2xl line-clamp-2 text-sm font-semibold leading-6 text-slate-200 sm:text-base">{featured.description}</p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-5 text-sm font-black text-slate-200">
                <span className="inline-flex items-center gap-1.5"><Eye size={16} /> {metric(featured.views)}</span>
                <span className="inline-flex items-center gap-1.5"><Download size={16} /> {metric(featured.downloads)}</span>
                <span className="inline-flex items-center gap-1.5"><Star className="fill-amber-300 text-amber-300" size={16} /> {featured.rating.toFixed(1)}</span>
              </div>
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-slate-950 transition hover:-translate-y-0.5" onClick={() => openDetail(featured)} type="button">
                เปิด Spotlight <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </article>

        <div className="nexus-glass rounded-[2rem] border p-5 backdrop-blur-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-300">TRENDING NOW</p>
              <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">อันดับที่คนกำลังสนใจ</h3>
            </div>
            <TrendingUp className="text-fuchsia-600 dark:text-fuchsia-300" />
          </div>
          <div className="grid gap-3">
            {trending.map((item, index) => (
              <button
                className="group grid min-h-24 grid-cols-[3rem_4.5rem_1fr] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 dark:border-white/10 dark:bg-white/5"
                key={item.id}
                onClick={() => openDetail(item)}
                type="button"
              >
                <span className="text-center text-2xl font-black text-slate-300 group-hover:text-fuchsia-500 dark:text-slate-600">0{index + 1}</span>
                <img alt="" className="h-16 w-full rounded-xl object-cover" src={item.cover} />
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-sm font-black text-slate-950 dark:text-white">{item.title}</span>
                  <span className="mt-1 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Eye size={13} /> {metric(item.views)}</span>
                    <span className="inline-flex items-center gap-1"><Star size={13} /> {item.rating.toFixed(1)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SmartSearchDialog({
  mediaItems,
  onClose,
  open,
  openDetail,
}: {
  mediaItems: MediaItem[]
  onClose: () => void
  open: boolean
  openDetail: (item: MediaItem) => void
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('th-TH')
    const ranked = [...mediaItems].sort((a, b) => engagementScore(b) - engagementScore(a))
    if (!needle) return ranked.slice(0, 6)
    return ranked.filter((item) => [item.title, item.description, item.topic, item.source, ...(item.tags ?? [])]
      .join(' ')
      .toLocaleLowerCase('th-TH')
      .includes(needle)).slice(0, 6)
  }, [mediaItems, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuery('')
        onClose()
      }
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div aria-label="ค้นหาสื่ออัจฉริยะ" aria-modal="true" className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/70 px-4 pt-[8vh] backdrop-blur-xl" role="dialog">
      <button aria-label="ปิดหน้าค้นหา" className="absolute inset-0 cursor-default" onClick={() => { setQuery(''); onClose() }} type="button" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 dark:border-white/10">
          <Search className="shrink-0 text-cyan-600 dark:text-cyan-300" size={22} />
          <input
            autoFocus
            className="min-h-16 w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อสื่อ หมวดหมู่ แท็ก หรือประเภทไฟล์..."
            value={query}
          />
          <button aria-label="ปิด" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300" onClick={() => { setQuery(''); onClose() }} type="button"><X size={18} /></button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-black tracking-[0.14em] text-slate-400">{query ? `ผลการค้นหา ${results.length} รายการ` : 'แนะนำสำหรับคุณ'}</p>
          {results.length ? results.map((item) => (
            <button
              className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-cyan-50 dark:hover:bg-white/5"
              key={item.id}
              onClick={() => { openDetail(item); setQuery(''); onClose() }}
              type="button"
            >
              <img alt="" className="h-14 w-14 rounded-xl object-cover" src={item.cover} />
              <span className="min-w-0">
                <span className="line-clamp-1 block font-black text-slate-950 dark:text-white">{item.title}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">{item.topic} · {item.source} · {item.access}</span>
              </span>
              <ArrowUpRight className="text-slate-300 transition group-hover:text-cyan-600" size={18} />
            </button>
          )) : (
            <div className="px-6 py-12 text-center">
              <Search className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 font-black text-slate-700 dark:text-slate-200">ยังไม่พบสื่อที่ตรงกับคำค้น</p>
              <p className="mt-1 text-sm text-slate-500">ลองใช้ชื่อหมวดหมู่ เช่น AI, อบรม หรือ Google Drive</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          <span>MIKPURINUT Nexus Smart Search</span>
          <span>ESC เพื่อปิด</span>
        </div>
      </div>
    </div>
  )
}
