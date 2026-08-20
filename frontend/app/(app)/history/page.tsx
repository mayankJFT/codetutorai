'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Github, HardDrive, History as HistoryIcon } from 'lucide-react'
import { tutorialAPI, type Project } from '@/lib/api'
import { cn, formatDuration, statusMeta } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Alert } from '@/components/ui/alert'
import { Stagger, StaggerItem } from '@/components/motion'
import { projectHref } from '@/components/projects/project-card'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
]

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function HistoryPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
  })

  const groups = useMemo(() => {
    const sorted = [...projects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((p) => (filter === 'all' ? true : filter === 'processing' ? p.status === 'processing' || p.status === 'pending' : p.status === filter))
    const map = new Map<string, Project[]>()
    for (const p of sorted) {
      const label = dayLabel(p.created_at)
      map.set(label, [...(map.get(label) ?? []), p])
    }
    return [...map.entries()]
  }, [projects, filter])

  return (
    <>
      <PageHeader title="History" description="A timeline of every generation run." />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.key ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error" title="Couldn't load history" action={<Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>} />
      ) : groups.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="Nothing here yet" description="Generation runs will appear here, grouped by day." action={<Button href="/new-project">New Project</Button>} />
      ) : (
        <div className="space-y-8">
          {groups.map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{label}</h2>
              <Stagger className="relative space-y-2 border-l-2 border-border pl-6">
                {items.map((p) => {
                  const meta = statusMeta(p.status)
                  const Icon = p.type === 'github' ? Github : HardDrive
                  const duration = p.completed_at ? new Date(p.completed_at).getTime() - new Date(p.created_at).getTime() : null
                  return (
                    <StaggerItem key={p.id}>
                      <button
                        onClick={() => router.push(projectHref(p))}
                        className="group relative flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-soft transition-all hover:-translate-y-px hover:shadow-lift"
                      >
                        <span className={cn('absolute -left-[31px] h-3 w-3 rounded-full ring-4 ring-background', meta.dot)} />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                          </div>
                          <p className="truncate font-mono text-xs text-muted-foreground">{p.source}</p>
                        </div>
                        <div className="hidden text-right text-xs text-muted-foreground sm:block">
                          <p>{new Date(p.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          {duration !== null && duration >= 0 && <p>took {formatDuration(duration)}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </StaggerItem>
                  )
                })}
              </Stagger>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
