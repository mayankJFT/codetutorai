'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const points = [
  'Chapter-based tutorials generated from any GitHub repo',
  'Architecture, abstractions and relationships mapped automatically',
  'Export to PDF, Markdown or HTML in one click',
]

export function BrandPanel() {
  const reduce = useReducedMotion()
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl" />

      <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
        <Sparkles className="h-4 w-4" /> CodeTutor AI
      </div>

      <div className="relative max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight">
          From repository to tutorial in minutes.
        </h2>
        <ul className="mt-8 space-y-4">
          {points.map((p, i) => (
            <motion.li
              key={p}
              className="flex items-start gap-3 text-white/90"
              initial={{ opacity: 0, x: reduce ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <span className="text-[15px]">{p}</span>
            </motion.li>
          ))}
        </ul>

        <motion.div
          className="mt-12 w-80 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lift backdrop-blur-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className={reduce ? '' : 'animate-float'}>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Chapter 3 · Flow orchestration</span>
              <span className="font-medium text-white">92%</span>
            </div>
            <Progress value={92} className="mt-2 h-1.5 bg-white/20" indicatorClassName="bg-white" />
            <p className="mt-3 text-xs text-white/70">Writing “Conditional transitions”…</p>
          </div>
        </motion.div>
      </div>

      <p className="relative text-xs text-white/60">© {new Date().getFullYear()} CodeTutor AI</p>
    </div>
  )
}
