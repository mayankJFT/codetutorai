'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Zap } from 'lucide-react'
import { tutorialAPI } from '@/lib/api'
import { relativeTime } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Pulse, Stagger, StaggerItem } from '@/components/motion'

export function ActiveJobs() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tutorialAPI.getDashboardStats(),
    refetchInterval: (q) => ((q.state.data?.active_jobs?.length ?? 0) > 0 ? 5000 : 30000),
  })
  const jobs = data?.active_jobs ?? []

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Active jobs</CardTitle>
          <CardDescription className="mt-1">Live generation pipeline</CardDescription>
        </div>
        {jobs.length > 0 && (
          <Badge variant="warning">
            <Pulse color="bg-amber-500" /> {jobs.length} running
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Zap className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">No active jobs</p>
            <p className="text-xs text-muted-foreground">Start a project and watch it build here.</p>
          </div>
        ) : (
          <Stagger className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <StaggerItem key={job.id}>
                <button
                  onClick={() => router.push(`/progress/${job.id}`)}
                  className="w-full rounded-lg border border-border p-3 text-left transition-all hover:border-indigo-200 hover:shadow-soft dark:hover:border-indigo-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{job.name || `Job ${job.id.slice(0, 8)}`}</p>
                    <span className="text-xs font-medium text-muted-foreground">{Math.round(Number(job.progress) || 0)}%</span>
                  </div>
                  <Progress value={Number(job.progress) || 0} className="mt-2 h-1.5" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate">
                      <Pulse color="bg-amber-500" className="h-2 w-2" /> {job.current_step || 'Queued'}
                    </span>
                    <span>{relativeTime(job.updated_at)}</span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </CardContent>
    </Card>
  )
}
