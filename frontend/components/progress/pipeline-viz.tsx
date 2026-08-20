'use client'

import { motion } from 'framer-motion'
import { BookCheck, Boxes, Check, GitBranch, Loader2, Network, PenLine, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  { key: 'fetch', label: 'Fetch repo', icon: GitBranch },
  { key: 'abstractions', label: 'Identify abstractions', icon: Boxes },
  { key: 'relationships', label: 'Map relationships', icon: Network },
  { key: 'chapters', label: 'Write chapters', icon: PenLine },
  { key: 'combine', label: 'Assemble tutorial', icon: BookCheck },
]

export function stageIndex(currentStep = '', progress = 0, status = 'processing'): number {
  if (status === 'completed') return STAGES.length
  const s = (currentStep || '').toLowerCase()
  if (s.includes('fetch')) return 0
  if (s.includes('abstraction')) return 1
  if (s.includes('relationship')) return 2
  if (s.includes('chapter') || s.includes('writing')) return 3
  if (s.includes('result') || s.includes('combin') || s.includes('saving') || progress >= 90) return 4
  return 0
}

export function PipelineViz({ currentStep, progress, status }: { currentStep?: string; progress: number; status: string }) {
  const active = stageIndex(currentStep, progress, status)
  const failed = status === 'failed'
  const complete = status === 'completed'

  return (
    <ol className="grid grid-cols-5 gap-1 sm:gap-2">
      {STAGES.map((st, i) => {
        const done = i < active || complete
        const isActive = i === active && !failed && !complete
        const isFailedHere = failed && i === active
        const Icon = st.icon
        return (
          <li key={st.key} className="relative flex flex-col items-center text-center">
            {i < STAGES.length - 1 && (
              <div className="absolute left-1/2 top-5 -z-10 h-0.5 w-full bg-border">
                <motion.div
                  className="h-full bg-gradient-primary"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            )}
            <motion.div
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card',
                done && 'border-emerald-500 bg-emerald-500 text-white',
                isActive && 'border-primary text-primary shadow-glow',
                !done && !isActive && !isFailedHere && 'border-border text-muted-foreground',
                isFailedHere && 'border-rose-500 text-rose-500'
              )}
            >
              {done ? <Check className="h-4 w-4" /> : isFailedHere ? <X className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </motion.div>
            <p className={cn('mt-2 hidden text-xs font-medium sm:block', isActive ? 'text-foreground' : 'text-muted-foreground')}>{st.label}</p>
          </li>
        )
      })}
    </ol>
  )
}
