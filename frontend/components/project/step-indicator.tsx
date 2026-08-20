'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !done && !active && 'border-border text-muted-foreground'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                <motion.div className="h-full bg-primary" initial={false} animate={{ scaleX: done ? 1 : 0 }} style={{ transformOrigin: 'left' }} transition={{ duration: 0.4 }} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
