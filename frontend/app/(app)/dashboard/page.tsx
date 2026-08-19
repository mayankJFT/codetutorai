'use client'

import { Plus } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { ActiveJobs } from '@/components/dashboard/active-jobs'
import { ActivityChart } from '@/components/dashboard/activity-chart'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const first = user?.full_name?.split(' ')[0]
  return (
    <>
      <PageHeader
        title={first ? `${greeting()}, ${first}` : greeting()}
        description="Here's what's happening with your tutorials."
        actions={
          <Button variant="gradient" href="/new-project">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />
      <div className="space-y-6">
        <StatsCards />
        <div className="grid gap-6 lg:grid-cols-3">
          <RecentProjects className="lg:col-span-2" />
          <ActiveJobs />
        </div>
        <ActivityChart />
      </div>
    </>
  )
}
