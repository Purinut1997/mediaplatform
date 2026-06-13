import { Archive, BrainCircuit, GraduationCap, ShieldCheck } from 'lucide-react'
import type { View } from '../types'

const portalTiles = [
  { label: 'คลังสื่อ', detail: 'ไฟล์ เอกสาร วิดีโอ', icon: Archive, view: 'media' as View },
  { label: 'AI Lab', detail: 'Prompt และคู่มือ AI', icon: BrainCircuit, view: 'media' as View },
  { label: 'ห้องอบรม', detail: 'บทเรียนและวิดีโอ', icon: GraduationCap, view: 'media' as View },
  { label: 'VIP Preview', detail: 'ดูสิ่งที่จะปลดล็อก', icon: ShieldCheck, view: 'media' as View },
]

export function PortalTiles({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {portalTiles.map((tile) => (
          <button
            className="group min-h-28 rounded-3xl border border-white/70 bg-white/74 p-5 text-left shadow-lg shadow-slate-950/5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.06]"
            key={tile.label}
            onClick={() => setView(tile.view)}
            type="button"
          >
            <tile.icon className="mb-4 text-cyan-600 transition group-hover:scale-110 dark:text-cyan-300" />
            <p className="text-lg font-black text-slate-950 dark:text-white">{tile.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {tile.detail}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
