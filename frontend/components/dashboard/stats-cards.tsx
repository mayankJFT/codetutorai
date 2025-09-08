'use client'

import { motion } from 'framer-motion'
import { FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { tutorialAPI, type DashboardStats } from '@/lib/api'

export function StatsCards() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tutorialAPI.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const stats = [
    {
      label: 'Total Projects',
      value: dashboardData?.stats.total_projects.value || 0,
      change: dashboardData?.stats.total_projects.change || '+0%',
      trend: dashboardData?.stats.total_projects.trend || 'neutral',
      color: 'from-blue-500 to-blue-600',
      icon: FileText,
    },
    {
      label: 'Completed',
      value: dashboardData?.stats.completed_projects.value || 0,
      change: dashboardData?.stats.completed_projects.change || '+0%',
      trend: dashboardData?.stats.completed_projects.trend || 'neutral',
      color: 'from-green-500 to-green-600',
      icon: CheckCircle,
    },
    {
      label: 'Processing',
      value: dashboardData?.stats.processing_projects.value || 0,
      change: dashboardData?.stats.processing_projects.change || '+0%',
      trend: dashboardData?.stats.processing_projects.trend || 'neutral',
      color: 'from-orange-500 to-orange-600',
      icon: Clock,
    },
    {
      label: 'Success Rate',
      value: dashboardData?.stats.success_rate.value || '0%',
      change: dashboardData?.stats.success_rate.change || '+0%',
      trend: dashboardData?.stats.success_rate.trend || 'neutral',
      color: 'from-purple-500 to-purple-600',
      icon: TrendingUp,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div>
              <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-barlow font-semibold ${
                stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                'text-slate-600 dark:text-slate-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-3xl font-barlow font-bold">{stat.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-barlow">{stat.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}