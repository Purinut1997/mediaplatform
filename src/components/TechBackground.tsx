import type { CSSProperties } from 'react'

const codeColumns = ['AI', '01', '</>', 'DATA', 'MIX', '{}', 'NEXUS', 'MEDIA', 'VIP', 'SYNC']

export function TechBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(125,211,252,.42),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(56,189,248,.30),transparent_32%),radial-gradient(circle_at_52%_86%,rgba(191,219,254,.42),transparent_36%),linear-gradient(180deg,rgba(255,255,255,.92),rgba(226,246,255,.78))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,.18),transparent_32%),linear-gradient(180deg,rgba(6,17,29,.98),rgba(8,22,38,.96))]" />
      <div className="academy-grid absolute inset-0" />
      <div className="ai-orbit left-[8%] top-[17%]" />
      <div className="ai-orbit ai-orbit-alt right-[10%] top-[12%]" />
      <CodeRain />
      <div className="particle-field absolute inset-0">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            style={
              {
                '--x': `${(index * 37) % 100}%`,
                '--y': `${(index * 61) % 100}%`,
                '--delay': `${index * 0.32}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

function CodeRain() {
  return (
    <div className="code-rain absolute inset-0">
      {codeColumns.map((text, index) => (
        <span
          key={`${text}-${index}`}
          style={
            {
              '--left': `${(index * 11 + 3) % 100}%`,
              '--delay': `${index * 0.55}s`,
              '--speed': `${7 + (index % 4)}s`,
            } as CSSProperties
          }
        >
          {text}
        </span>
      ))}
    </div>
  )
}
