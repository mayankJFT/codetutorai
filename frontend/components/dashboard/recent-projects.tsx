'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, FolderPlus, Github, HardDrive } from 'lucide-react'
import { tutorialAPI, type Project } from '@/lib/api'
import { cn, relativeTime, statusMeta } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Stagger, StaggerItem } from '@/components/motion'

export function projectHref(p: Project) {
  return (p.status === 'processing' || p.status === 'pending') && p.job_id ? `/progress/${p.job_id}` : `/projects/${p.id}`
}

export function RecentProjects({ className }: { className?: string }) {
  const router = useRouter()
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
    refetchInterval: 15000,
  })

  const recent = [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Recent projects</CardTitle>
          <CardDescription className="mt-1">Your latest tutorial generations</CardDescription>
        </div>
        <Button variant="ghost" size="sm" href="/projects" className="text-muted-foreground">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Generate your first tutorial from a GitHub repo or a local folder."
            className="py-10"
            action={<Button href="/new-project">New Project</Button>}
          />
        ) : (
          <Stagger className="divide-y divide-border">
            {recent.map((p) => {
              const meta = statusMeta(p.status)
              const Icon = p.type === 'github' ? Github : HardDrive
              return (
                <StaggerItem key={p.id}>
                  <button
                    onClick={() => router.push(projectHref(p))}
                    className="group flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <Badge variant={meta.badge}>{meta.label}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{p.source}</p>
                      {p.status === 'processing' && <Progress value={Number(p.progress)} className="mt-2 h-1.5" />}
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">{relativeTime(p.created_at)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </CardContent>
    </Card>
  )
}

