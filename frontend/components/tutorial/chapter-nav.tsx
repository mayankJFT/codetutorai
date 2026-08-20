'use client'

import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/select'

export function ChapterNav({ titles, active, onSelect }: { titles: string[]; active: number; onSelect: (i: number) => void }) {
  return (
    <>
      {/* Mobile: dropdown */}
      <div className="mb-4 lg:hidden">
        <Select value={String(active)} onChange={(e) => onSelect(Number(e.target.value))} aria-label="Select chapter">
          {titles.map((t, i) => (
            <option key={i} value={i}>{`${i + 1}. ${t}`}</option>
          ))}
        </Select>
      </div>
      {/* Desktop: sticky rail */}
      <nav className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapters</p>
        <ol className="space-y-1">
          {titles.map((t, i) => (
            <li key={i}>
              <button
                onClick={() => onSelect(i)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  i === active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className={cn('mt-0.5 font-mono text-xs', i === active ? 'text-accent-foreground' : 'text-muted-foreground/70')}>{String(i + 1).padStart(2, '0')}</span>
                <span className="line-clamp-2">{t}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
