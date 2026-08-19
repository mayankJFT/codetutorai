'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BookCheck, Boxes, Check, FileCode2, GitBranch, Loader2, Network, PenLine, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILES = ['pocketflow/__init__.py', 'flow.py', 'nodes.py', 'utils/call_llm.py', 'main.py']
const STEPS = [
  { label: 'Fetch repository', icon: GitBranch, detail: '5 files · 38 KB' },
  { label: 'Identify abstractions', icon: Boxes, detail: 'Node · Flow · BatchNode' },
  { label: 'Map relationships', icon: Network, detail: '7 dependencies found' },
  { label: 'Write chapters', icon: PenLine, detail: 'Chapter 3 of 4' },
  { label: 'Assemble tutorial', icon: BookCheck, detail: 'Markdown · PDF' },
]
const STEP_MS = 1800

export function ProductMock() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(reduce ? STEPS.length : 0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setStep((s) => (s >= STEPS.length ? 0 : s + 1))
      setTick((t) => t + 1)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [reduce])

  const done = step >= STEPS.length

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-rose-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted-foreground">codetutor.ai/progress/9f3a…</span>
      </div>
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="border-b border-border p-4 md:border-b-0 md:border-r">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Repository</p>
          <ul className="space-y-1.5">
            {FILES.map((f, i) => (
              <li key={f} className={cn('flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors', step >= 1 && 'text-foreground', step === 0 && i <= tick % FILES.length && 'bg-accent text-accent-foreground')}>
                <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-mono">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Generating tutorial</p>
            <AnimatePresence mode="wait">
              {done ? (
                <motion.span key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles className="h-3 w-3" /> Tutorial ready · 4 chapters · PDF
                </motion.span>
              ) : (
                <motion.span key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground">
                  {Math.round((step / STEPS.length) * 100)}% · Groq Llama
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <ol className="space-y-2.5">
            {STEPS.map((s, i) => {
              const isDone = i < step
              const isActive = i === step
              const Icon = s.icon
              return (
                <li key={s.label} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors', isActive ? 'border-indigo-200 bg-accent dark:border-indigo-900' : 'border-transparent')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px]', isDone && 'border-emerald-500 bg-emerald-500 text-white', isActive && 'border-primary text-primary', !isDone && !isActive && 'border-border text-muted-foreground')}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', !isDone && !isActive && 'text-muted-foreground')}>{s.label}</p>
                    {(isActive || isDone) && <p className="truncate text-xs text-muted-foreground">{s.detail}</p>}
                  </div>
                  {isActive && (
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <motion.div key={`${step}-${tick}`} className="h-full bg-gradient-primary" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: STEP_MS / 1000, ease: 'linear' }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
