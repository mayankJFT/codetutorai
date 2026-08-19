'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  const reduce = useReducedMotion()
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={cn('h-full rounded-full bg-gradient-primary', indicatorClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20 }}
      />
    </div>
  )
}
