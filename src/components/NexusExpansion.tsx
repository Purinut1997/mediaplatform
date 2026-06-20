import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  Bot,
  Check,
  Copy,
  Download,
  FolderPlus,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  LibraryBig,
  Medal,
  Plus,
  QrCode,
  Search,
  Share2,
  Sparkles,
  Trash2,
  UserRoundCheck,
  X,
  Zap,
} from 'lucide-react'
import { LOGO_URL } from '../brand'
import type { MediaItem } from '../types'

type LocalCollection = { id: string; mediaIds: number[]; name: string }

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readCollections(): LocalCollection[] {
  try {
    const value = JSON.parse(window.localStorage.getItem('nexus-collections') ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('th-TH', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function scoreGuideResult(item: MediaItem, query: string) {
  const words = query.toLocaleLowerCase('th-TH').split(/\s+/).filter(Boolean)
  const title = item.title.toLocaleLowerCase('th-TH')
  const topic = item.topic.toLocaleLowerCase('th-TH')
  const body = `${item.description} ${item.source} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase('th-TH')
  return words.reduce((score, word) => score + (title.includes(word) ? 6 : 0) + (topic.includes(word) ? 4 : 0) + (body.includes(word) ? 2 : 0), 0)
}

export function NexusExpansion({
  mediaItems,
  mode = 'all',
  openDetail,
  recentMediaIds,
}: {
  mediaItems: MediaItem[]
  mode?: 'all' | 'discover' | 'personal' | 'about'
  openDetail: (item: MediaItem) => void
  recentMediaIds: number[]
}) {
  const [collections, setCollections] = useState<LocalCollection[]>(readCollections)
  const [collectionName, setCollectionName] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState(() => readCollections()[0]?.id ?? '')
  const [guideQuery, setGuideQuery] = useState('')
  const [guideActive, setGuideActive] = useState(false)
  const [shareItem, setShareItem] = useState<MediaItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installMessage, setInstallMessage] = useState('')

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId) ?? collections[0]
  const totalViews = mediaItems.reduce((sum, item) => sum + item.views, 0)
  const totalDownloads = mediaItems.reduce((sum, item) => sum + item.downloads, 0)
  const averageRating = mediaItems.length ? mediaItems.reduce((sum, item) => sum + item.rating, 0) / mediaItems.length : 0
  const guideResults = useMemo(() => {
    if (!guideActive) return []
    const scored = mediaItems.map((item) => ({ item, score: scoreGuideResult(item, guideQuery) }))
      .sort((a, b) => b.score - a.score)
    const matched = scored.filter((entry) => entry.score > 0)
    return (matched.length ? matched : scored.sort((a, b) => b.item.rating - a.item.rating)).slice(0, 3).map((entry) => entry.item)
  }, [guideActive, guideQuery, mediaItems])

  const persistCollections = (next: LocalCollection[]) => {
    setCollections(next)
    window.localStorage.setItem('nexus-collections', JSON.stringify(next))
  }

  const createCollection = () => {
    const name = collectionName.trim()
    if (!name) return
    const nextCollection = { id: crypto.randomUUID(), mediaIds: [], name }
    persistCollections([...collections, nextCollection])
    setSelectedCollectionId(nextCollection.id)
    setCollectionName('')
  }

  const toggleCollectionItem = (mediaId: number) => {
    if (!selectedCollection) return
    const next = collections.map((collection) => collection.id === selectedCollection.id
      ? { ...collection, mediaIds: collection.mediaIds.includes(mediaId) ? collection.mediaIds.filter((id) => id !== mediaId) : [...collection.mediaIds, mediaId] }
      : collection)
    persistCollections(next)
  }

  const removeCollection = () => {
    if (!selectedCollection) return
    const next = collections.filter((collection) => collection.id !== selectedCollection.id)
    persistCollections(next)
    setSelectedCollectionId(next[0]?.id ?? '')
  }

  const installApp = async () => {
    if (!installPrompt) {
      setInstallMessage('เปิดเมนูเบราว์เซอร์ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”')
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallMessage(choice.outcome === 'accepted' ? 'ติดตั้ง MIKPURINUT Nexus แล้ว' : 'คุณสามารถติดตั้งภายหลังได้ทุกเมื่อ')
    setInstallPrompt(null)
  }

  const achievements = [
    { earned: recentMediaIds.length >= 1, icon: Sparkles, label: 'First Discovery', text: 'เปิดสื่อแรกใน Nexus' },
    { earned: recentMediaIds.length >= 3, icon: GraduationCap, label: 'Learning Streak', text: 'สำรวจสื่ออย่างน้อย 3 รายการ' },
    { earned: collections.some((collection) => collection.mediaIds.length > 0), icon: LibraryBig, label: 'Curator', text: 'สร้างคอลเลกชันส่วนตัว' },
    { earned: recentMediaIds.length >= Math.min(6, mediaItems.length), icon: Medal, label: 'Nexus Explorer', text: 'สำรวจคลังสื่ออย่างต่อเนื่อง' },
  ]

  return (
    <>
      <section className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 ${mode === 'all' || mode === 'discover' ? '' : 'hidden'}`}>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-6 text-white shadow-2xl shadow-cyan-950/10 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-cyan-300"><Bot size={16} /> AI MEDIA GUIDE</p>
                <h2 className="mt-3 text-3xl font-black sm:text-4xl">บอกเป้าหมาย แล้วให้ Nexus ช่วยเลือก</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">ค้นหาเชิงความหมายจากชื่อ หมวดหมู่ และรายละเอียดสื่อในระบบ ไม่ส่งคำถามไปบริการ AI ภายนอกและไม่มีค่า API</p>
              </div>
              <Zap className="shrink-0 text-fuchsia-300" size={28} />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 backdrop-blur">
                <Search className="text-cyan-300" size={19} />
                <input className="w-full bg-transparent font-bold text-white outline-none placeholder:text-slate-400" onChange={(event) => { setGuideQuery(event.target.value); setGuideActive(false) }} onKeyDown={(event) => { if (event.key === 'Enter') setGuideActive(true) }} placeholder="เช่น อยากทำใบงาน AI หรือระบบเช็กชื่อ..." value={guideQuery} />
              </label>
              <button className="min-h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 font-black text-slate-950" onClick={() => setGuideActive(true)} type="button">แนะนำสื่อให้ฉัน</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['AI สำหรับครู', 'เช็กชื่อออนไลน์', 'จัดอบรม', 'งานบริหารโรงเรียน'].map((prompt) => <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10" key={prompt} onClick={() => { setGuideQuery(prompt); setGuideActive(true) }} type="button">{prompt}</button>)}
            </div>
            {guideActive && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {guideResults.map((item) => <button className="group overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-left" key={item.id} onClick={() => openDetail(item)} type="button"><img alt="" className="h-28 w-full object-cover" src={item.cover} /><span className="block p-3"><span className="text-[10px] font-black text-cyan-300">แนะนำจากเป้าหมาย</span><span className="mt-1 line-clamp-2 block text-sm font-black">{item.title}</span></span></button>)}
              </div>
            )}
          </div>

          <div className="nexus-glass rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300"><BarChart3 size={16} /> NEXUS PULSE</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">คลังนี้กำลังเติบโต</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[['สื่อในระบบ', mediaItems.length], ['ยอดเข้าชม', totalViews], ['ดาวน์โหลด', totalDownloads], ['คะแนนเฉลี่ย', averageRating]].map(([label, value]) => <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5" key={label as string}><p className="text-2xl font-black text-slate-950 dark:text-white">{label === 'คะแนนเฉลี่ย' ? Number(value).toFixed(1) : formatMetric(Number(value))}</p><p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p></div>)}
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-cyan-50 to-fuchsia-50 p-4 dark:from-cyan-300/10 dark:to-fuchsia-300/10"><p className="text-sm font-black text-slate-800 dark:text-white">Live insight</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">สื่อที่มียอดเข้าชมสูงสุดตอนนี้คือ “{[...mediaItems].sort((a, b) => b.views - a.views)[0]?.title ?? '-'}”</p></div>
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 ${mode === 'all' || mode === 'personal' ? '' : 'hidden'}`}>
        <div className="mb-5">
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300"><LibraryBig size={17} /> Personal Collections</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">จัดสื่อให้เข้ากับงานของคุณ</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">คอลเลกชันเก็บบนอุปกรณ์นี้ เหมาะสำหรับเตรียมสอน เตรียมอบรม หรือวางแผนงานส่วนตัว</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="nexus-glass rounded-[2rem] border p-5 backdrop-blur-xl">
            <div className="flex gap-2"><input className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 font-bold dark:border-white/10 dark:bg-slate-900" onChange={(event) => setCollectionName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') createCollection() }} placeholder="ชื่อคอลเลกชันใหม่" value={collectionName} /><button aria-label="สร้างคอลเลกชัน" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-slate-950" onClick={createCollection} type="button"><Plus size={20} /></button></div>
            <div className="mt-4 grid gap-2">
              {collections.length ? collections.map((collection) => <button className={`flex min-h-12 items-center justify-between rounded-2xl px-4 text-left font-black ${selectedCollection?.id === collection.id ? 'bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950' : 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200'}`} key={collection.id} onClick={() => setSelectedCollectionId(collection.id)} type="button"><span className="line-clamp-1">{collection.name}</span><span className="text-xs opacity-70">{collection.mediaIds.length}</span></button>) : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15"><FolderPlus className="mx-auto text-slate-300" /><p className="mt-3 font-black text-slate-700 dark:text-slate-200">สร้างคอลเลกชันแรกของคุณ</p></div>}
            </div>
            {selectedCollection && <button className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-rose-600" onClick={removeCollection} type="button"><Trash2 size={16} />ลบคอลเลกชันนี้</button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {mediaItems.slice(0, 6).map((item) => {
              const saved = selectedCollection?.mediaIds.includes(item.id) ?? false
              return <article className="nexus-card grid grid-cols-[6rem_1fr] overflow-hidden rounded-3xl border backdrop-blur-xl" key={item.id}><img alt="" className="h-full min-h-36 w-full object-cover" src={item.cover} /><div className="flex flex-col p-4"><p className="text-xs font-black text-cyan-700 dark:text-cyan-300">{item.topic}</p><h3 className="mt-1 line-clamp-2 font-black text-slate-950 dark:text-white">{item.title}</h3><div className="mt-auto flex gap-2 pt-3"><button className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl text-xs font-black ${saved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`} disabled={!selectedCollection} onClick={() => toggleCollectionItem(item.id)} type="button">{saved ? <Check size={15} /> : <Plus size={15} />}{saved ? 'บันทึกแล้ว' : 'เก็บไว้'}</button><button aria-label={`แชร์ ${item.title}`} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => setShareItem(item)} type="button"><Share2 size={16} /></button></div></div></article>
            })}
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 ${mode === 'all' || mode === 'personal' ? '' : 'hidden'}`}>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="nexus-glass rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-amber-700 dark:text-amber-300"><Award size={16} /> ACHIEVEMENTS</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">ทุกการสำรวจมีความหมาย</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => <div className={`flex items-center gap-4 rounded-2xl border p-4 ${achievement.earned ? 'border-amber-300 bg-amber-50 dark:border-amber-300/20 dark:bg-amber-300/10' : 'border-slate-200 bg-slate-50 opacity-55 dark:border-white/10 dark:bg-white/5'}`} key={achievement.label}><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${achievement.earned ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}><achievement.icon size={22} /></div><div><p className="font-black text-slate-950 dark:text-white">{achievement.label}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{achievement.text}</p></div></div>)}
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700 p-6 text-white shadow-2xl sm:p-8">
            <div className="flex items-start justify-between"><div><p className="text-xs font-black tracking-[0.18em] text-cyan-100">INSTALL NEXUS</p><h2 className="mt-3 text-3xl font-black">พกคลังสื่อไว้บนหน้าจอหลัก</h2></div><Download size={30} /></div>
            <p className="mt-4 text-sm font-semibold leading-7 text-blue-100">เปิดได้เหมือนแอป เข้าถึงเร็วขึ้น และใช้ไอคอน MIKPURINUT Nexus บนอุปกรณ์ของคุณ</p>
            <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-blue-700" onClick={() => void installApp()} type="button"><Download size={19} />ติดตั้ง MIKPURINUT Nexus</button>
            {installMessage && <p className="mt-3 rounded-xl bg-black/15 p-3 text-xs font-bold leading-5">{installMessage}</p>}
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 ${mode === 'all' || mode === 'about' ? '' : 'hidden'}`}>
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
            <img alt="MIKPURINUT" className="h-28 w-28 rounded-[2rem] border border-white/20 object-cover shadow-2xl" src={LOGO_URL} />
            <div><p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] text-cyan-300"><UserRoundCheck size={16} /> CREATOR PROFILE</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Created by MIKPURINUT</h2><p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">ผู้ออกแบบ MIKPURINUT Nexus แพลตฟอร์มสื่อและเครื่องมือ AI สำหรับโรงเรียน ผู้จัดอบรม และผู้ดูแลระบบยุคใหม่</p><div className="mt-4 flex flex-wrap gap-2">{['AI School Portal', 'Media Operations', 'Cloudflare', 'Neon PostgreSQL'].map((skill) => <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300" key={skill}>{skill}</span>)}</div></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><p className="text-2xl font-black text-cyan-300">{mediaItems.length}</p><p className="text-xs font-bold text-slate-400">ผลงานในระบบ</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><Globe2 className="mx-auto text-fuchsia-300" /><p className="mt-1 text-xs font-bold text-slate-400">Digital Learning</p></div></div>
          </div>
        </div>
      </section>

      {shareItem && <ShareDialog item={shareItem} copied={copied} onClose={() => { setShareItem(null); setCopied(false) }} onCopied={() => setCopied(true)} />}
    </>
  )
}

function ShareDialog({ item, copied, onClose, onCopied }: { item: MediaItem; copied: boolean; onClose: () => void; onCopied: () => void }) {
  const shareUrl = `${window.location.origin}/?media=${item.id}`
  const qrUrl = `https://quickchart.io/qr?size=280&margin=2&text=${encodeURIComponent(shareUrl)}`
  const shareText = `${item.title} — MIKPURINUT Nexus`

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    onCopied()
  }
  const nativeShare = async () => {
    if (navigator.share) await navigator.share({ title: item.title, text: shareText, url: shareUrl })
    else await copyLink()
  }

  return <div aria-label={`แชร์ ${item.title}`} aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-xl" role="dialog"><button aria-label="ปิดหน้าต่างแชร์" className="absolute inset-0 cursor-default" onClick={onClose} type="button" /><div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-950"><button aria-label="ปิด" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/75 text-white" onClick={onClose} type="button"><X size={18} /></button><div className="relative h-48"><img alt="" className="h-full w-full object-cover" src={item.cover} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" /><div className="absolute bottom-5 left-5 right-5 text-white"><p className="text-xs font-black text-cyan-300">SHARE FROM MIKPURINUT NEXUS</p><h2 className="mt-2 line-clamp-2 text-2xl font-black">{item.title}</h2></div></div><div className="grid gap-5 p-6 sm:grid-cols-[10rem_1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-2"><img alt={`QR สำหรับ ${item.title}`} className="w-full" src={qrUrl} /></div><div className="flex flex-col justify-center"><p className="inline-flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white"><QrCode size={18} />สแกนเพื่อเปิดสื่อ</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">แชร์ผ่าน QR, ลิงก์ หรือเมนูแชร์ของอุปกรณ์ พร้อมเครดิต MIKPURINUT</p><button className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 font-black text-slate-700 dark:bg-white/10 dark:text-white" onClick={() => void copyLink()} type="button">{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</button><button className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => void nativeShare()} type="button"><Share2 size={17} />แชร์ไปยังแอปอื่น</button></div></div><div className="flex items-center gap-2 border-t border-slate-200 px-6 py-3 text-xs font-bold text-slate-400 dark:border-white/10"><ImageIcon size={14} />MIKPURINUT Nexus Share Card</div></div></div>
}
