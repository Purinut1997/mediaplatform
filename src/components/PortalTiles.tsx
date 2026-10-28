import { ArrowLeft, Compass, GraduationCap, Info, LibraryBig } from 'lucide-react'

export type HomeSection = 'overview' | 'discover' | 'learn' | 'personal' | 'about'

const portalTiles = [
  { accent: 'from-cyan-400 to-blue-500', detail: 'สื่อยอดนิยม · กำลังมาแรง', icon: Compass, label: 'สำรวจสื่อยอดนิยม', value: 'discover' as HomeSection },
  { accent: 'from-violet-500 to-fuchsia-500', detail: 'ชุดการเรียนรู้ · แผนการสอน', icon: GraduationCap, label: 'เส้นทางการเรียนรู้', value: 'learn' as HomeSection },
  { accent: 'from-amber-400 to-orange-500', detail: 'คอลเลกชัน · รายการโปรด', icon: LibraryBig, label: 'คลังส่วนตัวของฉัน', value: 'personal' as HomeSection },
  { accent: 'from-emerald-400 to-cyan-500', detail: 'ความปลอดภัย · ข้อมูลระบบ', icon: Info, label: 'เกี่ยวกับระบบ', value: 'about' as HomeSection },
]

export function PortalTiles({ active, onSelect }: { active: HomeSection; onSelect: (value: HomeSection) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">หมวดหมู่และเส้นทางใช้งาน</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">เลือกพื้นที่ที่ต้องการใช้งาน</h2>
        </div>
        {active !== 'overview' && (
          <button className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-cyan-300 bg-cyan-50 px-4 text-sm font-black text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200" onClick={() => onSelect('overview')} type="button"><ArrowLeft size={16} />แสดงภาพรวมทั้งหมดบนหน้าหลัก</button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {portalTiles.map((tile) => {
          const selected = active === tile.value
          return (
            <button
              aria-pressed={selected}
              className={`group relative min-h-32 overflow-hidden rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${selected ? 'border-transparent bg-slate-950 text-white shadow-xl shadow-cyan-950/15 dark:bg-white dark:text-slate-950' : 'nexus-card'}`}
              key={tile.value}
              onClick={() => onSelect(tile.value)}
              type="button"
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tile.accent}`} />
              <span className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${tile.accent} text-white shadow-lg transition group-hover:scale-105`}><tile.icon size={21} /></span>
              <span className="block text-lg font-black">{tile.label}</span>
              <span className={`mt-1 block text-xs font-semibold ${selected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{tile.detail}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
