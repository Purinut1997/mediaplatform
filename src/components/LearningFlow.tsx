import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Download, Eye, Layers3, LockKeyhole, Play, Route, Sparkles, Star, X } from 'lucide-react'
import { getPreviewUrl } from '../lib/media'
import type { MediaItem } from '../types'

type LearningPath = {
  accent: string
  description: string
  id: string
  items: MediaItem[]
  title: string
}

function buildLearningPaths(mediaItems: MediaItem[]): LearningPath[] {
  const definitions = [
    {
      accent: 'from-cyan-500 to-blue-600',
      description: 'เริ่มจากพื้นฐาน AI ไปจนถึงชุด Prompt ที่นำไปใช้กับงานสอนได้จริง',
      id: 'ai-starter',
      matches: ['AI', 'Prompt'],
      title: 'AI Starter for Educators',
    },
    {
      accent: 'from-violet-500 to-fuchsia-600',
      description: 'เครื่องมือและเอกสารสำหรับลดงานซ้ำ เพิ่มความเร็วให้การบริหารโรงเรียน',
      id: 'school-workflow',
      matches: ['AppScript', 'โรงเรียน', 'งานเอกสาร'],
      title: 'Smart School Workflow',
    },
    {
      accent: 'from-amber-400 to-orange-600',
      description: 'บทเรียน วิดีโอ และแนวทางสำหรับผู้จัดอบรมและผู้ดูแลระบบ',
      id: 'training-ops',
      matches: ['อบรม'],
      title: 'Training & Media Operations',
    },
  ]

  return definitions.map((definition) => ({
    ...definition,
    items: mediaItems.filter((item) => definition.matches.includes(item.topic)).slice(0, 4),
  })).filter((path) => path.items.length > 0)
}

export function LearningFlow({
  mediaItems,
  openDetail,
  openPreview,
  recentMediaIds,
}: {
  mediaItems: MediaItem[]
  openDetail: (item: MediaItem) => void
  openPreview: (item: MediaItem) => void
  recentMediaIds: number[]
}) {
  const paths = buildLearningPaths(mediaItems)
  const completed = new Set(recentMediaIds)
  const recentItems = recentMediaIds
    .map((id) => mediaItems.find((item) => item.id === id))
    .filter((item): item is MediaItem => Boolean(item))
    .slice(0, 3)

  if (!paths.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      {recentItems.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-200/60 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 p-5 text-white shadow-2xl shadow-cyan-950/10 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-cyan-300"><Clock3 size={15} /> CONTINUE LEARNING</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">กลับมาเรียนต่อจากครั้งล่าสุด</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-300">Nexus จำสื่อที่คุณเปิดล่าสุดไว้บนอุปกรณ์นี้ โดยไม่ส่งประวัติเพิ่มออกจากเบราว์เซอร์</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {recentItems.map((item, index) => (
              <button className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15" key={item.id} onClick={() => openDetail(item)} type="button">
                <img alt="" className="h-16 w-full rounded-xl object-cover" src={item.cover} />
                <span className="min-w-0">
                  <span className="block text-[10px] font-black tracking-[0.14em] text-cyan-300">{index === 0 ? 'ล่าสุด' : `ก่อนหน้า ${index}`}</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-black text-white">{item.title}</span>
                </span>
                <Play className="text-cyan-300" size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300"><Route size={17} /> Nexus Learning Paths</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">เรียนเป็นเส้นทาง ไม่หลงในกองไฟล์</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">ระบบจัดกลุ่มจากหมวดหมู่จริง และแสดงความคืบหน้าจากสื่อที่คุณเคยเปิด</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {paths.map((path, pathIndex) => {
          const completedCount = path.items.filter((item) => completed.has(item.id)).length
          const progress = Math.round((completedCount / path.items.length) * 100)
          const nextItem = path.items.find((item) => !completed.has(item.id)) ?? path.items[0]
          return (
            <article className="nexus-card overflow-hidden rounded-[2rem] border backdrop-blur-xl" key={path.id}>
              <div className={`bg-gradient-to-br ${path.accent} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black backdrop-blur">PATH 0{pathIndex + 1}</span>
                  <Layers3 size={22} />
                </div>
                <h3 className="mt-6 text-2xl font-black leading-tight">{path.title}</h3>
                <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-white/85">{path.description}</p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-black"><span>{completedCount}/{path.items.length} สื่อ</span><span>{progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  {path.items.map((item, index) => (
                    <button className="group flex min-h-14 items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-cyan-50 dark:hover:bg-white/5" key={item.id} onClick={() => openPreview(item)} type="button">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${completed.has(item.id) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>
                        {completed.has(item.id) ? <CheckCircle2 size={17} /> : index + 1}
                      </span>
                      <span className="line-clamp-2 flex-1 text-sm font-black text-slate-800 dark:text-slate-100">{item.title}</span>
                      <Eye className="text-slate-300 transition group-hover:text-cyan-600" size={16} />
                    </button>
                  ))}
                </div>
                <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => openDetail(nextItem)} type="button">
                  {progress > 0 && progress < 100 ? 'เรียนต่อในเส้นทาง' : progress === 100 ? 'ทบทวนเส้นทาง' : 'เริ่มเส้นทางนี้'} <ArrowRight size={17} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function QuickPreviewDialog({
  item,
  onClose,
  openDetail,
}: {
  item: MediaItem | null
  onClose: () => void
  openDetail: (item: MediaItem) => void
}) {
  if (!item) return null
  const previewUrl = getPreviewUrl(item)

  return (
    <div aria-label={`ดูตัวอย่าง ${item.title}`} aria-modal="true" className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xl" role="dialog">
      <button aria-label="ปิดตัวอย่าง" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:bg-slate-950">
        <button aria-label="ปิด" className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950/75 text-white backdrop-blur" onClick={onClose} type="button"><X size={19} /></button>
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-72 overflow-hidden bg-slate-900 lg:min-h-[520px]">
            {previewUrl ? (
              <iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" className="absolute inset-0 h-full w-full" referrerPolicy="strict-origin-when-cross-origin" src={previewUrl} title={`ตัวอย่าง ${item.title}`} />
            ) : (
              <>
                <img alt={item.title} className="absolute inset-0 h-full w-full object-cover" src={item.cover} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-black backdrop-blur"><LockKeyhole size={14} /> ตัวอย่างแบบปลอดภัย</p>
                  <p className="mt-3 text-sm font-semibold text-slate-200">ลิงก์จริงจะแสดงหลังระบบตรวจสอบสิทธิ์ในหน้ารายละเอียด</p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{item.topic}</span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800 dark:bg-violet-300/10 dark:text-violet-200">{item.access}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{item.source}</span>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-300"><Sparkles size={15} /> QUICK PREVIEW</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-100 p-3 text-center dark:bg-white/5"><Eye className="mx-auto text-cyan-600" size={18} /><p className="mt-1 font-black">{item.views.toLocaleString('th-TH')}</p><p className="text-[10px] font-bold text-slate-500">เข้าชม</p></div>
              <div className="rounded-2xl bg-slate-100 p-3 text-center dark:bg-white/5"><Download className="mx-auto text-cyan-600" size={18} /><p className="mt-1 font-black">{item.downloads.toLocaleString('th-TH')}</p><p className="text-[10px] font-bold text-slate-500">ดาวน์โหลด</p></div>
              <div className="rounded-2xl bg-slate-100 p-3 text-center dark:bg-white/5"><Star className="mx-auto fill-amber-400 text-amber-400" size={18} /><p className="mt-1 font-black">{item.rating.toFixed(1)}</p><p className="text-[10px] font-bold text-slate-500">คะแนน</p></div>
            </div>
            <button className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => { openDetail(item); onClose() }} type="button"><BookOpenCheck size={19} /> เปิดรายละเอียดและเริ่มเรียน</button>
          </div>
        </div>
      </div>
    </div>
  )
}
