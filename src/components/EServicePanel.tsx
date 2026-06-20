import { useEffect, useMemo, useState } from 'react'
import {
  Edit3,
  ExternalLink,
  Grid3X3,
  ImagePlus,
  LockKeyhole,
  Pin,
  Plus,
  Search,
  ServerCog,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { LOGO_URL } from '../brand'
import type { CurrentUser, EServiceItem, EServiceQuota, View } from '../types'

type ServiceSource = 'purchased' | 'custom' | 'demo'

type ServiceItem = Omit<EServiceItem, 'id' | 'source' | 'createdAt' | 'updatedAt'> & { id: number | string; source: ServiceSource; createdAt?: string; updatedAt?: string }

type ServiceForm = Pick<ServiceItem, 'category' | 'description' | 'iconDataUrl' | 'title' | 'url'>

const emptyForm: ServiceForm = { category: 'งานทั่วไป', description: '', iconDataUrl: '', title: '', url: '' }

const demoServices: ServiceItem[] = [
  { id: 'demo-student', title: 'ระบบดูแลนักเรียน', description: 'ข้อมูลนักเรียนและงานดูแลช่วยเหลือ', category: 'นักเรียน', url: 'https://example.com', iconDataUrl: LOGO_URL, pinned: true, source: 'demo' },
  { id: 'demo-bigdata', title: 'School Big Data', description: 'แดชบอร์ดข้อมูลเพื่อการบริหาร', category: 'บริหาร', url: 'https://example.com', iconDataUrl: '', pinned: true, source: 'demo' },
  { id: 'demo-attendance', title: 'ระบบเช็กชื่อออนไลน์', description: 'บันทึกเวลาเรียนและสรุปการมาเรียน', category: 'นักเรียน', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo' },
  { id: 'demo-safety', title: 'แจ้งเตือนภัยในโรงเรียน', description: 'ช่องทางแจ้งเหตุและติดตามสถานะ', category: 'ความปลอดภัย', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo' },
  { id: 'demo-mis', title: 'School MIS', description: 'ศูนย์รวมงานสารสนเทศโรงเรียน', category: 'บริหาร', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo' },
  { id: 'demo-dmc', title: 'DMC Portal', description: 'ทางลัดเข้าสู่ระบบข้อมูลนักเรียน', category: 'ภายนอก', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo' },
]

function safeServiceUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function sourceLabel(source: ServiceSource) {
  if (source === 'purchased') return 'ระบบจาก MIKPURINUT'
  if (source === 'custom') return 'เพิ่มเอง'
  return 'ตัวอย่างหน้าตา'
}

export function EServicePanel({ currentUser, setView }: { currentUser: CurrentUser | null; setView: (view: View) => void }) {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [quota, setQuota] = useState<EServiceQuota>({ limit: currentUser?.role === 'member' ? (currentUser.access === 'VIP' ? 18 : 6) : null, used: 0, remaining: currentUser?.role === 'member' ? (currentUser.access === 'VIP' ? 18 : 6) : null })
  const [loading, setLoading] = useState(Boolean(currentUser))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [error, setError] = useState('')

  const allServices = currentUser ? services : demoServices
  const customLimit = quota.limit ?? Number.POSITIVE_INFINITY
  const customCount = quota.used
  const quotaReached = Number.isFinite(customLimit) && customCount >= customLimit
  const quotaLabel = Number.isFinite(customLimit) ? `${customCount}/${customLimit}` : `${customCount}/∞`
  const categories = ['ทั้งหมด', ...new Set(allServices.map((item) => item.category))]
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('th-TH')
    return [...allServices]
      .filter((item) => category === 'ทั้งหมด' || item.category === category)
      .filter((item) => !needle || `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('th-TH').includes(needle))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.title.localeCompare(b.title, 'th'))
  }, [allServices, category, query])

  useEffect(() => {
    if (!currentUser) return
    let active = true
    fetch('/api/member/services', { credentials: 'include' })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!active) return
        if (!response.ok) throw new Error(result.error || 'โหลด E-Service ไม่สำเร็จ')
        setServices(result.services ?? [])
        setQuota(result.quota)
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : 'โหลด E-Service ไม่สำเร็จ'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [currentUser])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
    setError('')
    setFormOpen(false)
  }

  const saveService = async () => {
    if (!currentUser) return setView('login')
    const title = form.title.trim()
    const url = safeServiceUrl(form.url)
    if (!title) return setError('กรุณากรอกชื่อระบบ')
    if (!url) return setError('URL ต้องเป็น https:// ที่ถูกต้อง')
    if (quotaReached && !editingId) return setError(`สิทธิ์บัญชีนี้เพิ่มลิงก์เองได้สูงสุด ${customLimit} ช่อง`)
    const payload = {
      id: editingId ? Number(editingId) : undefined,
      title,
      url,
      description: form.description.trim(),
      category: form.category.trim() || 'งานทั่วไป',
      iconDataUrl: form.iconDataUrl,
    }
    setLoading(true)
    try {
      const response = await fetch('/api/member/services', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'บันทึก E-Service ไม่สำเร็จ')
      setServices((current) => editingId ? current.map((service) => Number(service.id) === Number(editingId) ? result.service : service) : [result.service, ...current])
      if (result.quota) setQuota(result.quota)
      resetForm()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึก E-Service ไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  const updatePin = async (item: ServiceItem) => {
    const response = await fetch('/api/member/services', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: Number(item.id), pinned: !item.pinned }) })
    if (response.ok) setServices((current) => current.map((service) => service.id === item.id ? { ...service, pinned: !service.pinned } : service))
  }

  const deleteService = async (item: ServiceItem) => {
    const response = await fetch(`/api/member/services?id=${Number(item.id)}`, { method: 'DELETE', credentials: 'include' })
    const result = await response.json()
    if (response.ok) { setServices((current) => current.filter((service) => service.id !== item.id)); if (result.quota) setQuota(result.quota) }
    else setError(result.error || 'ลบ E-Service ไม่สำเร็จ')
  }

  const editService = (item: ServiceItem) => {
    if (item.source !== 'custom') return
    setEditingId(String(item.id))
    setForm({ category: item.category, description: item.description, iconDataUrl: item.iconDataUrl, title: item.title, url: item.url })
    setError('')
    setFormOpen(true)
  }

  const readIcon = (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('รองรับเฉพาะ PNG, JPG และ WebP')
    if (file.size > 80 * 1024) return setError('ไอคอนต้องมีขนาดไม่เกิน 80 KB')
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, iconDataUrl: String(reader.result ?? '') }))
    reader.readAsDataURL(file)
  }

  const openService = (item: ServiceItem) => {
    const url = safeServiceUrl(item.url)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-300"><Grid3X3 size={16} /> MY E-SERVICE</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">ระบบของฉัน อยู่ที่เดียว</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">รวมระบบที่ได้รับจาก MIKPURINUT และทางลัดที่คุณเพิ่มเอง เปิดใช้งานได้เร็วจากทุกการ์ด</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[['ทั้งหมด', allServices.length], ['จากผู้พัฒนา', allServices.filter((item) => item.source === 'purchased').length], ['ช่องเพิ่มเอง', currentUser ? quotaLabel : 'DEMO']].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" key={String(label)}><p className="text-2xl font-black text-cyan-300">{value}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{label}</p></div>)}
          </div>
        </div>
      </div>

      {!currentUser && <div className="mt-5 flex flex-col justify-between gap-4 rounded-3xl border border-amber-300/60 bg-amber-50 p-5 sm:flex-row sm:items-center dark:border-amber-300/20 dark:bg-amber-300/10"><div><p className="font-black text-amber-900 dark:text-amber-100">กำลังดูตัวอย่าง E‑Service</p><p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-200">เข้าสู่ระบบเพื่อสร้างรายการส่วนตัวของคุณ ตัวอย่างด้านล่างไม่เปิดระบบจริง</p></div><button className="min-h-11 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200" onClick={() => setView('login')} type="button">เข้าสู่ระบบเพื่อใช้งาน</button></div>}
      {currentUser && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-900 dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-100"><ShieldCheck className="shrink-0" size={19} /><p>{quota.limit === null ? 'ผู้ดูแลเพิ่มลิงก์ได้ไม่จำกัด' : `บัญชีนี้เพิ่มลิงก์เองได้ ${quota.limit.toLocaleString('th-TH')} ช่อง`} ส่วนระบบที่ซื้อจาก MIKPURINUT ไม่หักโควตา</p></div>}

      <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 shadow-sm dark:border-white/10 dark:bg-white/5"><Search className="text-cyan-600" size={18} /><input className="w-full bg-transparent font-bold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อระบบหรือหมวดหมู่..." value={query} /></label>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">{categories.map((item) => <button className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-black ${category === item ? 'bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950' : 'border border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}</div>
        <button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 font-black text-white shadow-lg shadow-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(currentUser && quotaReached)} onClick={() => currentUser ? setFormOpen(true) : setView('login')} title={quotaReached ? 'ใช้ช่องเพิ่มเองครบแล้ว' : undefined} type="button"><Plus size={19} />{quotaReached ? 'ใช้ช่องครบแล้ว' : 'เพิ่ม E‑Service'}</button>
      </div>

      {loading && !services.length ? <div className="mt-6 rounded-[2rem] border border-dashed border-cyan-300/30 p-12 text-center font-black text-cyan-700">กำลังโหลด E‑Service...</div> : filtered.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((item) => <ServiceCard item={item} key={item.id} onDelete={() => void deleteService(item)} onEdit={() => editService(item)} onOpen={() => openService(item)} onPin={() => void updatePin(item)} />)}</div> : <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 p-12 text-center dark:border-white/15"><ServerCog className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-xl font-black">ยังไม่มี E‑Service ในหมวดนี้</h2><p className="mt-2 text-sm text-slate-500">เพิ่มลิงก์ระบบแรก หรือรอระบบที่ซื้อจาก MIKPURINUT ถูกมอบให้บัญชีของคุณ</p></div>}

      {formOpen && <div aria-label={editingId ? 'แก้ไข E-Service' : 'เพิ่ม E-Service'} aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-xl" role="dialog"><button aria-label="ปิดฟอร์ม" className="absolute inset-0 cursor-default" onClick={resetForm} type="button" /><div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8"><button aria-label="ปิด" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-white/10" onClick={resetForm} type="button"><X size={18} /></button><p className="text-xs font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-300">E-SERVICE SHORTCUT</p><h2 className="mt-2 text-2xl font-black">{editingId ? 'แก้ไขทางลัด' : 'เพิ่มระบบของคุณ'}</h2><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-black">ชื่อระบบ<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={80} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="เช่น ระบบเช็กชื่อออนไลน์" value={form.title} /></label><label className="grid gap-2 text-sm font-black">URL ระบบ<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." value={form.url} /></label><label className="grid gap-2 text-sm font-black">หมวดหมู่<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={40} onChange={(event) => setForm({ ...form, category: event.target.value })} value={form.category} /></label><label className="grid gap-2 text-sm font-black">คำอธิบาย<textarea className="min-h-24 rounded-2xl border border-slate-200 bg-white p-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={160} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="ระบบนี้ใช้สำหรับ..." value={form.description} /></label><label className="flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/5">{form.iconDataUrl ? <img alt="ตัวอย่างไอคอน" className="h-14 w-14 rounded-2xl object-cover" src={form.iconDataUrl} /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><ImagePlus size={24} /></span>}<span><span className="block text-sm font-black">อัปโหลดไอคอน</span><span className="mt-1 block text-xs font-semibold text-slate-500">PNG, JPG, WebP ไม่เกิน 80 KB</span></span><input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => readIcon(event.target.files?.[0])} type="file" /></label>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-300/10 dark:text-rose-200">{error}</p>}<button className="min-h-12 rounded-2xl bg-slate-950 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={saveService} type="button">{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มใน E-Service ของฉัน'}</button></div></div></div>}
    </section>
  )
}

function ServiceCard({ item, onDelete, onEdit, onOpen, onPin }: { item: ServiceItem; onDelete: () => void; onEdit: () => void; onOpen: () => void; onPin: () => void }) {
  const editable = item.source === 'custom'
  const initials = item.title.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <article className="nexus-card group relative flex min-h-72 flex-col overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl transition hover:-translate-y-1"><div className="flex items-start justify-between gap-3"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black text-white shadow-lg">{item.iconDataUrl ? <img alt={`ไอคอน ${item.title}`} className="h-full w-full object-cover" loading="lazy" src={item.iconDataUrl} /> : initials}</div><button aria-label={item.pinned ? `เลิกปักหมุด ${item.title}` : `ปักหมุด ${item.title}`} className={`grid h-10 w-10 place-items-center rounded-xl ${item.pinned ? 'bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300' : 'bg-slate-100 text-slate-400 dark:bg-white/10'}`} disabled={!editable} onClick={onPin} type="button"><Pin className={item.pinned ? 'fill-current' : ''} size={17} /></button></div><div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-[10px] font-black ${item.source === 'purchased' ? 'bg-emerald-100 text-emerald-700' : item.source === 'demo' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>{sourceLabel(item.source)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{item.category}</span></div><h2 className="mt-3 line-clamp-2 text-xl font-black text-slate-950 dark:text-white">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{item.description || 'ทางลัดเข้าสู่ระบบภายนอกของคุณ'}</p><div className="mt-auto flex gap-2 pt-5">{item.source !== 'demo' ? <button className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={onOpen} type="button">เปิดระบบ<ExternalLink size={16} /></button> : <button className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-100 px-3 text-sm font-black text-violet-700" disabled type="button"><LockKeyhole size={16} />ตัวอย่าง</button>}{editable && <><button aria-label={`แก้ไข ${item.title}`} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" onClick={onEdit} type="button"><Edit3 size={16} /></button><button aria-label={`ลบ ${item.title}`} className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-300/10 dark:text-rose-300" onClick={onDelete} type="button"><Trash2 size={16} /></button></>}</div></article>
}
