import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.6)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer dark:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.08)_50%,transparent_70%)]',
        className
      )}
    />
  )
}
