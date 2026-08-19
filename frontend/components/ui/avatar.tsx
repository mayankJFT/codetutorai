import { cn } from '@/lib/utils'

const palettes = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-500',
  'from-rose-500 to-pink-500',
]

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?'
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const sz = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }[size]
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white', palettes[idx], sz, className)}>
      {initials}
    </div>
  )
}
