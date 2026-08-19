import { cn } from '@/lib/utils'

export function Pulse({ className, color = 'bg-emerald-500' }: { className?: string; color?: string }) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring', color)} />
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', color)} />
    </span>
  )
}
