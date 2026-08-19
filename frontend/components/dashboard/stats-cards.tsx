'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, FolderOpen, Loader2, TrendingUp } from 'lucide-react'
import { tutorialAPI } from '@/lib/api'
import { StatCard } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Stagger, StaggerItem } from '@/components/motion'

export function StatsCards() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tutorialAPI.getDashboardStats(),
    refetchInterval: (q) => ((q.state.data?.active_jobs?.length ?? 0) > 0 ? 5000 : 30000),
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Alert variant="error" title="Couldn't load your stats" action={<Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>}>
        The dashboard API didn't respond. Check that the backend is running.
      </Alert>
    )
  }

  const s = data.stats
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StaggerItem>
        <StatCard label="Total projects" value={s.total_projects.value} delta={s.total_projects.change} trend={s.total_projects.trend} icon={FolderOpen} accent="indigo" />
      </StaggerItem>
      <StaggerItem>
        <StatCard label="Completed" value={s.completed_projects.value} delta={s.completed_projects.change} trend={s.completed_projects.trend} icon={CheckCircle2} accent="emerald" />
      </StaggerItem>
      <StaggerItem>
        <StatCard label="Processing" value={s.processing_projects.value} delta={s.processing_projects.change} deltaLabel="active now" trend={s.processing_projects.trend} icon={Loader2} accent="amber" />
      </StaggerItem>
      <StaggerItem>
        <StatCard label="Success rate" value={s.success_rate.value} delta={s.success_rate.change} deltaLabel="of all jobs" trend={s.success_rate.trend} icon={TrendingUp} accent="sky" />
      </StaggerItem>
    </Stagger>
  )
}
