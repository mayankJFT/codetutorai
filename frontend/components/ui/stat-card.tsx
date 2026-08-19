'use client'

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import { Card } from './card'
import { AnimatedNumber } from '@/components/motion/animated-number'
import { cn } from '@/lib/utils'

const accents = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300',
}

export function StatCard({
  label,
  value,
  suffix,
  delta,
  deltaLabel = 'vs last week',
  trend = 'neutral',
  icon: Icon,
  accent = 'indigo',
  className,
}: {
  label: string
  value: number | string
  suffix?: string
  delta?: string
  deltaLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  accent?: keyof typeof accents
  className?: string
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendCls = trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
  return (
    <Card className={cn('p-5 transition-shadow hover:shadow-lift', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {delta && (
        <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trendCls)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {delta}
          <span className="font-normal text-muted-foreground"> {deltaLabel}</span>
        </p>
      )}
    </Card>
  )
}
