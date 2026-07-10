import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Edit3,
  EllipsisVertical,
  ExternalLink,
  FolderKanban,
  GripVertical,
  Grid3X3,
  ImagePlus,
  Layers3,
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

type ServiceItem = Omit<EServiceItem, 'id' | 'source' | 'createdAt' | 'updatedAt'> & {
  id: number | string
  source: ServiceSource
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

type ServiceForm = Pick<ServiceItem, 'category' | 'description' | 'iconDataUrl' | 'title' | 'url'>

const allCategory = 'ทั้งหมด'
const defaultCategory = 'งานทั่วไป'
const emptyForm: ServiceForm = { category: defaultCategory, description: '', iconDataUrl: '', title: '', url: '' }
const maxIconSourceBytes = 12 * 1024 * 1024
const maxIconOutputBytes = 80 * 1024

const demoServices: ServiceItem[] = [
  { id: 'demo-student', title: 'ระบบดูแลนักเรียน', description: 'ข้อมูลนักเรียนและงานดูแลช่วยเหลือ', category: 'นักเรียน', url: 'https://example.com', iconDataUrl: LOGO_URL, pinned: true, source: 'demo', sortOrder: 10 },
  { id: 'demo-bigdata', title: 'School Big Data', description: 'แดชบอร์ดข้อมูลเพื่อการบริหาร', category: 'บริหาร', url: 'https://example.com', iconDataUrl: '', pinned: true, source: 'demo', sortOrder: 20 },
  { id: 'demo-attendance', title: 'ระบบเช็กชื่อออนไลน์', description: 'บันทึกเวลาเรียนและสรุปการมาเรียน', category: 'นักเรียน', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo', sortOrder: 30 },
  { id: 'demo-safety', title: 'แจ้งเตือนภัยในโรงเรียน', description: 'ช่องทางแจ้งเหตุและติดตามสถานะ', category: 'ความปลอดภัย', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo', sortOrder: 40 },
  { id: 'demo-mis', title: 'School MIS', description: 'ศูนย์รวมงานสารสนเทศโรงเรียน', category: 'บริหาร', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo', sortOrder: 50 },
  { id: 'demo-dmc', title: 'DMC Portal', description: 'ทางลัดเข้าสู่ระบบข้อมูลนักเรียน', category: 'ภายนอก', url: 'https://example.com', iconDataUrl: '', pinned: false, source: 'demo', sortOrder: 60 },
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

function serviceSort(a: ServiceItem, b: ServiceItem) {
  const orderA = Number.isFinite(a.sortOrder) ? Number(a.sortOrder) : 0
  const orderB = Number.isFinite(b.sortOrder) ? Number(b.sortOrder) : 0
  return Number(b.pinned) - Number(a.pinned) || orderA - orderB || a.title.localeCompare(b.title, 'th')
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('อ่านไฟล์ภาพไม่สำเร็จ'))
    reader.readAsDataURL(blob)
  })
}

async function optimizeIcon(file: File) {
  const bitmap = await createImageBitmap(file)
  try {
    for (const size of [256, 192, 128]) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d', { alpha: true })
      if (!context) throw new Error('เบราว์เซอร์ไม่รองรับการย่อภาพ')
      const scale = Math.max(size / bitmap.width, size / bitmap.height)
      const width = bitmap.width * scale
      const height = bitmap.height * scale
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
      for (const quality of [0.86, 0.72, 0.58, 0.44]) {
        const blob = await canvasBlob(canvas, quality)
        if (blob && blob.size <= maxIconOutputBytes) {
          return { dataUrl: await blobDataUrl(blob), size, bytes: blob.size }
        }
      }
    }
  } finally {
    bitmap.close()
  }
  throw new Error('ไม่สามารถบีบภาพให้เล็กกว่า 80 KB ได้ กรุณาเลือกภาพอื่น')
}

export function EServicePanel({ currentUser, setView }: { currentUser: CurrentUser | null; setView: (view: View) => void }) {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [quota, setQuota] = useState<EServiceQuota>({ limit: currentUser?.role === 'member' ? (currentUser.access === 'VIP' ? 18 : 6) : null, used: 0, remaining: currentUser?.role === 'member' ? (currentUser.access === 'VIP' ? 18 : 6) : null })
  const [loading, setLoading] = useState(Boolean(currentUser))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(allCategory)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [error, setError] = useState('')
  const [iconStatus, setIconStatus] = useState('')
  const [draggingId, setDraggingId] = useState('')
  const [dragOverId, setDragOverId] = useState('')
  const pressTimerRef = useRef<number | null>(null)
  const pressIdRef = useRef('')
  const pressPointRef = useRef({ x: 0, y: 0 })
  const longPressActiveRef = useRef(false)
  const suppressOpenRef = useRef(false)

  const allServices = currentUser ? services : demoServices
  const customLimit = quota.limit ?? Number.POSITIVE_INFINITY
  const customCount = quota.used
  const quotaReached = Number.isFinite(customLimit) && customCount >= customLimit
  const quotaLabel = Number.isFinite(customLimit) ? `${customCount}/${customLimit}` : `${customCount}/∞`
  const categories = useMemo(() => [allCategory, ...Array.from(new Set(allServices.map((item) => item.category || defaultCategory)))], [allServices])
  const categoryCounts = useMemo(() => allServices.reduce<Record<string, number>>((map, item) => {
    const key = item.category || defaultCategory
    map[key] = (map[key] ?? 0) + 1
    return map
  }, {}), [allServices])
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('th-TH')
    return [...allServices]
      .filter((item) => category === allCategory || item.category === category)
      .filter((item) => !needle || `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('th-TH').includes(needle))
      .sort(serviceSort)
  }, [allServices, category, query])
  const groupedSections = useMemo(() => {
    const map = new Map<string, ServiceItem[]>()
    for (const item of filtered) {
      const key = item.category || defaultCategory
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
  }, [filtered])

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
    setIconStatus('')
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
      category: form.category.trim() || defaultCategory,
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

  const reorderServices = async (fromId: string, toId: string) => {
    if (!currentUser || fromId === toId) return
    const from = services.find((item) => String(item.id) === fromId)
    const to = services.find((item) => String(item.id) === toId)
    if (!from || !to || from.category !== to.category) return
    if (from.pinned !== to.pinned) {
      setError('รายการที่ปักหมุดย้ายได้เฉพาะในกลุ่มปักหมุด ส่วนรายการทั่วไปย้ายได้เฉพาะในกลุ่มทั่วไป')
      return
    }
    const sameCategory = services.filter((item) => item.category === to.category && item.pinned === to.pinned).sort(serviceSort)
    const fromIndex = sameCategory.findIndex((item) => String(item.id) === fromId)
    const toIndex = sameCategory.findIndex((item) => String(item.id) === toId)
    if (fromIndex < 0 || toIndex < 0) return
    const ordered = [...sameCategory]
    const [moved] = ordered.splice(fromIndex, 1)
    ordered.splice(toIndex, 0, moved)
    const idOrder = ordered.map((item) => Number(item.id)).filter(Number.isInteger)
    setServices((current) => current.map((service) => {
      const index = idOrder.indexOf(Number(service.id))
      return index >= 0 ? { ...service, sortOrder: (index + 1) * 10 } : service
    }))
    try {
      const response = await fetch('/api/member/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reorder', category: to.category, pinned: to.pinned, ids: idOrder }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'บันทึกลำดับไม่สำเร็จ')
      if (Array.isArray(result.services)) setServices(result.services)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกลำดับไม่สำเร็จ')
    }
  }

  const editService = (item: ServiceItem) => {
    if (item.source !== 'custom') return
    setEditingId(String(item.id))
    setForm({ category: item.category, description: item.description, iconDataUrl: item.iconDataUrl, title: item.title, url: item.url })
    setError('')
    setFormOpen(true)
  }

  const readIcon = async (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('รองรับเฉพาะ PNG, JPG และ WebP')
    if (file.size > maxIconSourceBytes) return setError('ภาพต้นฉบับต้องมีขนาดไม่เกิน 12 MB')
    setError('')
    setIconStatus('กำลังย่อและบีบอัดภาพ...')
    try {
      const optimized = await optimizeIcon(file)
      setForm((current) => ({ ...current, iconDataUrl: optimized.dataUrl }))
      setIconStatus(`ปรับเป็น WebP ${optimized.size}×${optimized.size}px · ${(optimized.bytes / 1024).toFixed(1)} KB แล้ว`)
    } catch (reason) {
      setIconStatus('')
      setError(reason instanceof Error ? reason.message : 'ย่อภาพไม่สำเร็จ')
    }
  }

  const openService = (item: ServiceItem) => {
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false
      return
    }
    const url = safeServiceUrl(item.url)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const clearLongPress = () => {
    if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current)
    pressTimerRef.current = null
  }

  const dragTargetFromPoint = (clientX: number, clientY: number, categoryName: string, pinned: boolean) => {
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-service-id]')
    if (!element || element.dataset.serviceCategory !== categoryName) return ''
    if (element.dataset.servicePinned !== String(pinned)) return ''
    return element.dataset.serviceId ?? ''
  }

  const onCardPointerDown = (event: ReactPointerEvent, item: ServiceItem) => {
    if (!currentUser || item.source === 'demo') return
    const target = event.target as HTMLElement
    if (target.closest('[data-eservice-control="true"]')) return
    clearLongPress()
    pressIdRef.current = String(item.id)
    pressPointRef.current = { x: event.clientX, y: event.clientY }
    longPressActiveRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    pressTimerRef.current = window.setTimeout(() => {
      longPressActiveRef.current = true
      suppressOpenRef.current = true
      setDraggingId(String(item.id))
      setDragOverId(String(item.id))
    }, 420)
  }

  const onCardPointerMove = (event: ReactPointerEvent, item: ServiceItem) => {
    const dx = Math.abs(event.clientX - pressPointRef.current.x)
    const dy = Math.abs(event.clientY - pressPointRef.current.y)
    if (!longPressActiveRef.current && (dx > 10 || dy > 10)) {
      clearLongPress()
      return
    }
    if (!longPressActiveRef.current) return
    event.preventDefault()
    const targetId = dragTargetFromPoint(event.clientX, event.clientY, item.category, item.pinned)
    if (targetId) setDragOverId(targetId)
  }

  const onCardPointerUp = (event: ReactPointerEvent, item: ServiceItem) => {
    clearLongPress()
    if (!longPressActiveRef.current) return
    event.preventDefault()
    const fromId = pressIdRef.current
    const toId = dragTargetFromPoint(event.clientX, event.clientY, item.category, item.pinned) || dragOverId || fromId
    longPressActiveRef.current = false
    pressIdRef.current = ''
    setDraggingId('')
    setDragOverId('')
    void reorderServices(fromId, toId)
  }

  const onCardPointerCancel = () => {
    clearLongPress()
    longPressActiveRef.current = false
    pressIdRef.current = ''
    setDraggingId('')
    setDragOverId('')
  }

  const onDragStart = (event: DragEvent, item: ServiceItem) => {
    if (!currentUser || item.source === 'demo') return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(item.id))
    setDraggingId(String(item.id))
  }

  const onDragOver = (event: DragEvent, item: ServiceItem) => {
    if (!currentUser || item.source === 'demo') return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverId(String(item.id))
  }

  const onDrop = (event: DragEvent, item: ServiceItem) => {
    event.preventDefault()
    const fromId = event.dataTransfer.getData('text/plain') || draggingId
    setDraggingId('')
    setDragOverId('')
    void reorderServices(fromId, String(item.id))
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-300"><Grid3X3 size={16} /> MY E-SERVICE</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">ระบบของฉัน อยู่ที่เดียว</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">รวมระบบที่ได้รับจาก MIKPURINUT และทางลัดที่คุณเพิ่มเอง แยกเป็นหมวดชัดเจน และลากเรียงลำดับได้ตามงานจริง</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[[allCategory, allServices.length], ['หมวดหมู่', Math.max(0, categories.length - 1)], ['ช่องเพิ่มเอง', currentUser ? quotaLabel : 'DEMO']].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" key={String(label)}><p className="text-2xl font-black text-cyan-300">{value}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{label}</p></div>)}
          </div>
        </div>
      </div>

      {!currentUser && <div className="mt-5 flex flex-col justify-between gap-4 rounded-3xl border border-amber-300/60 bg-amber-50 p-5 sm:flex-row sm:items-center dark:border-amber-300/20 dark:bg-amber-300/10"><div><p className="font-black text-amber-900 dark:text-amber-100">กำลังดูตัวอย่าง E‑Service</p><p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-200">เข้าสู่ระบบเพื่อสร้างรายการส่วนตัวของคุณ ตัวอย่างด้านล่างไม่เปิดระบบจริง</p></div><button className="min-h-11 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200" onClick={() => setView('login')} type="button">เข้าสู่ระบบเพื่อใช้งาน</button></div>}
      {currentUser && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-900 dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-100"><ShieldCheck className="shrink-0" size={19} /><p>{quota.limit === null ? 'ผู้ดูแลเพิ่มลิงก์ได้ไม่จำกัด' : `บัญชีนี้เพิ่มลิงก์เองได้ ${quota.limit.toLocaleString('th-TH')} ช่อง`} ส่วนระบบที่ซื้อจาก MIKPURINUT ไม่หักโควตา · กดค้างที่การ์ดประมาณครึ่งวินาที แล้วลากไปวางตำแหน่งใหม่ภายในหมวดเดียวกัน</p></div>}

      <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 shadow-sm dark:border-white/10 dark:bg-white/5"><Search className="text-cyan-600" size={18} /><input className="w-full bg-transparent font-bold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อระบบหรือหมวดหมู่..." value={query} /></label>
        <button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 font-black text-white shadow-lg shadow-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(currentUser && quotaReached)} onClick={() => currentUser ? setFormOpen(true) : setView('login')} title={quotaReached ? 'ใช้ช่องเพิ่มเองครบแล้ว' : undefined} type="button"><Plus size={19} />{quotaReached ? 'ใช้ช่องครบแล้ว' : 'เพิ่ม E‑Service'}</button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => <button className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition ${category === item ? 'bg-slate-950 text-cyan-200 shadow-lg shadow-cyan-500/10 dark:bg-cyan-300 dark:text-slate-950' : 'border border-slate-200 bg-white/70 text-slate-600 hover:border-cyan-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`} key={item} onClick={() => setCategory(item)} type="button"><FolderKanban size={16} />{item}<span className={`rounded-full px-2 py-0.5 text-[10px] ${category === item ? 'bg-white/20' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-200'}`}>{item === allCategory ? allServices.length : (categoryCounts[item] ?? 0)}</span></button>)}
      </div>

      {loading && !services.length ? <div className="mt-6 rounded-[2rem] border border-dashed border-cyan-300/30 p-12 text-center font-black text-cyan-700">กำลังโหลด E‑Service...</div> : groupedSections.length ? <div className="mt-6 space-y-7">{groupedSections.map((section) => (
        <section className="rounded-[2rem] border border-cyan-300/15 bg-white/55 p-4 shadow-xl shadow-cyan-950/5 backdrop-blur dark:bg-slate-950/35" key={section.name}>
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white"><Layers3 className="text-cyan-500" size={20} />{section.name}</h2>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{section.items.length.toLocaleString('th-TH')} ระบบในหมวดนี้ · ปักหมุดอยู่หน้าสุดเสมอ และลากเปลี่ยนตำแหน่งได้เฉพาะในกลุ่มเดียวกัน</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {section.items.map((item) => <ServiceCard draggable={Boolean(currentUser && item.source !== 'demo')} dragging={draggingId === String(item.id)} dragOver={dragOverId === String(item.id)} item={item} key={item.id} onDelete={() => void deleteService(item)} onDragEnd={() => { setDraggingId(''); setDragOverId('') }} onDragOver={(event) => onDragOver(event, item)} onDragStart={(event) => onDragStart(event, item)} onDrop={(event) => onDrop(event, item)} onEdit={() => editService(item)} onOpen={() => openService(item)} onPin={() => void updatePin(item)} onPointerCancel={onCardPointerCancel} onPointerDown={(event) => onCardPointerDown(event, item)} onPointerMove={(event) => onCardPointerMove(event, item)} onPointerUp={(event) => onCardPointerUp(event, item)} />)}
          </div>
        </section>
      ))}</div> : <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 p-12 text-center dark:border-white/15"><ServerCog className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-xl font-black">ยังไม่มี E‑Service ในหมวดนี้</h2><p className="mt-2 text-sm text-slate-500">เพิ่มลิงก์ระบบแรก หรือรอระบบที่ซื้อจาก MIKPURINUT ถูกมอบให้บัญชีของคุณ</p></div>}

      {error && !formOpen && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100">{error}</p>}

      {formOpen && <div aria-label={editingId ? 'แก้ไข E-Service' : 'เพิ่ม E-Service'} aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-xl" role="dialog"><button aria-label="ปิดฟอร์ม" className="absolute inset-0 cursor-default" onClick={resetForm} type="button" /><div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8"><button aria-label="ปิด" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-white/10" onClick={resetForm} type="button"><X size={18} /></button><p className="text-xs font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-300">E-SERVICE SHORTCUT</p><h2 className="mt-2 text-2xl font-black">{editingId ? 'แก้ไขทางลัด' : 'เพิ่มระบบของคุณ'}</h2><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-black">ชื่อระบบ<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={80} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="เช่น ระบบเช็กชื่อออนไลน์" value={form.title} /></label><label className="grid gap-2 text-sm font-black">URL ระบบ<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." value={form.url} /></label><label className="grid gap-2 text-sm font-black">หมวดหมู่<input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={40} onChange={(event) => setForm({ ...form, category: event.target.value })} value={form.category} /></label><label className="grid gap-2 text-sm font-black">คำอธิบาย<textarea className="min-h-24 rounded-2xl border border-slate-200 bg-white p-4 font-semibold dark:border-white/10 dark:bg-white/5" maxLength={160} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="ระบบนี้ใช้สำหรับ..." value={form.description} /></label><label className="flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/5">{form.iconDataUrl ? <img alt="ตัวอย่างไอคอน" className="h-14 w-14 rounded-2xl object-cover" src={form.iconDataUrl} /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><ImagePlus size={24} /></span>}<span><span className="block text-sm font-black">อัปโหลดไอคอน</span><span className="mt-1 block text-xs font-semibold text-slate-500">รับภาพต้นฉบับไม่เกิน 12 MB · ย่อเป็น WebP ไม่เกิน 80 KB อัตโนมัติ</span></span><input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void readIcon(event.target.files?.[0])} type="file" /></label>{iconStatus && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">{iconStatus}</p>}{error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-300/10 dark:text-rose-200">{error}</p>}<button className="min-h-12 rounded-2xl bg-slate-950 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={saveService} type="button">{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มใน E-Service ของฉัน'}</button></div></div></div>}
    </section>
  )
}

function ServiceCard({ draggable, dragging, dragOver, item, onDelete, onDragEnd, onDragOver, onDragStart, onDrop, onEdit, onOpen, onPin, onPointerCancel, onPointerDown, onPointerMove, onPointerUp }: { draggable: boolean; dragging: boolean; dragOver: boolean; item: ServiceItem; onDelete: () => void; onDragEnd: () => void; onDragOver: (event: DragEvent) => void; onDragStart: (event: DragEvent) => void; onDrop: (event: DragEvent) => void; onEdit: () => void; onOpen: () => void; onPin: () => void; onPointerCancel: () => void; onPointerDown: (event: ReactPointerEvent) => void; onPointerMove: (event: ReactPointerEvent) => void; onPointerUp: (event: ReactPointerEvent) => void }) {
  const editable = item.source === 'custom'
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = item.title.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const deleteItem = () => {
    setMenuOpen(false)
    if (window.confirm(`ลบ E-Service “${item.title}” ใช่หรือไม่`)) onDelete()
  }

  return (
    <article className={`nexus-card group relative flex flex-col overflow-visible rounded-3xl border p-2.5 backdrop-blur-xl transition sm:p-3 ${dragging ? 'scale-95 opacity-60 ring-2 ring-cyan-300' : 'hover:-translate-y-1 hover:shadow-2xl'} ${dragOver ? 'ring-2 ring-amber-300' : ''}`} data-service-category={item.category} data-service-id={String(item.id)} data-service-pinned={String(item.pinned)} draggable={draggable} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragStart={onDragStart} onDrop={onDrop} onPointerCancel={onPointerCancel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {draggable && <div className="absolute left-4 top-4 z-20 inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur active:cursor-grabbing dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300" title="กดค้างแล้วลากเพื่อย้ายลำดับ"><GripVertical size={17} /></div>}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5">
        <button aria-label={item.pinned ? `เลิกปักหมุด ${item.title}` : `ปักหมุด ${item.title}`} className={`grid h-9 w-9 place-items-center rounded-xl border shadow-sm backdrop-blur transition ${item.pinned ? 'border-amber-300/60 bg-amber-100/95 text-amber-700 dark:bg-amber-300/20 dark:text-amber-300' : 'border-slate-200 bg-white/90 text-slate-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300'}`} data-eservice-control="true" disabled={!editable} onClick={onPin} type="button"><Pin className={item.pinned ? 'fill-current' : ''} size={16} /></button>
        {editable && <div className="relative">
          <button aria-expanded={menuOpen} aria-label={`เมนูจัดการ ${item.title}`} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300" data-eservice-control="true" onClick={() => setMenuOpen((value) => !value)} type="button"><EllipsisVertical size={18} /></button>
          {menuOpen && <><button aria-label="ปิดเมนูจัดการ" className="fixed inset-0 z-20 cursor-default" data-eservice-control="true" onClick={() => setMenuOpen(false)} type="button" /><div className="absolute right-0 top-13 z-30 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10" data-eservice-control="true" onClick={() => { setMenuOpen(false); onEdit() }} type="button"><Edit3 size={17} />แก้ไขระบบ</button>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-300/10" data-eservice-control="true" onClick={deleteItem} type="button"><Trash2 size={17} />ลบระบบ</button>
          </div></>}
        </div>}
      </div>

      <button aria-label={item.source === 'demo' ? `ตัวอย่าง ${item.title}` : `เปิดระบบ ${item.title}`} className="group/icon relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-white/90 bg-white text-3xl font-black text-cyan-700 shadow-lg shadow-slate-900/10 transition hover:scale-[1.015] hover:shadow-cyan-500/20 disabled:cursor-default" disabled={item.source === 'demo'} onClick={onOpen} title={item.source === 'demo' ? 'รายการตัวอย่าง' : `คลิกเพื่อเปิด ${item.title}`} type="button">
        {item.iconDataUrl ? <img alt={`ไอคอน ${item.title}`} className="h-full w-full object-contain p-2" loading="lazy" src={item.iconDataUrl} /> : initials}
        <span className="absolute inset-0 grid place-items-center bg-slate-950/65 opacity-0 transition group-hover/icon:opacity-100">{item.source === 'demo' ? <LockKeyhole size={28} /> : <ExternalLink size={28} />}</span>
        <span className={`absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[9px] font-black shadow-sm ${item.source === 'purchased' ? 'bg-emerald-100 text-emerald-700' : item.source === 'demo' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>{sourceLabel(item.source)}</span>
      </button>

      <div className="px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2"><h2 className="line-clamp-1 min-w-0 text-lg font-black text-slate-950 dark:text-white">{item.title}</h2>{item.source !== 'demo' && <ExternalLink className="mt-1 shrink-0 text-cyan-600 dark:text-cyan-300" size={15} />}</div>
        <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{item.description || item.category}</p>
      </div>
    </article>
  )
}
