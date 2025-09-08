'use client'

import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { ActivityChart } from '@/components/dashboard/activity-chart'
import { ActiveJobs } from '@/components/dashboard/active-jobs'

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-barlow font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 font-barlow">
          Welcome back! Here's an overview of your tutorial generation activity.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Grid - Improved Symmetry */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Projects - Takes 3 columns */}
        <div className="lg:col-span-3">
          <RecentProjects />
        </div>

        {/* Active Jobs - Takes 2 columns for better balance */}
        <div className="lg:col-span-2">
          <ActiveJobs />
        </div>
      </div>

      {/* Activity Chart */}
      <ActivityChart />
    </div>
  )
}