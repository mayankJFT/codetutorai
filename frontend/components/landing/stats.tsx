'use client'

import { AnimatedNumber, FadeIn } from '@/components/motion'

const stats = [
  { value: 20, suffix: '+', label: 'Programming languages' },
  { value: 5, suffix: '', label: 'AI pipeline stages' },
  { value: 3, suffix: '', label: 'Export formats' },
  { value: 10, suffix: ' min', prefix: '<', label: 'Typical generation time' },
]

export function Stats() {
  return (
    <section id="export" className="scroll-mt-20 bg-slate-900 py-16 text-white dark:bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.06} className="text-center">
            <p className="text-4xl font-semibold tracking-tight">
              {s.prefix}
              <AnimatedNumber value={s.value} />
              {s.suffix}
            </p>
            <p className="mt-2 text-sm text-slate-300">{s.label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
