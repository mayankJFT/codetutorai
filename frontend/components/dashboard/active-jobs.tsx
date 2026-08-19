'use client'

import { motion } from 'framer-motion'
import { 
  Loader2, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { tutorialAPI, type Project } from '@/lib/api'
import { useRouter } from 'next/navigation'
import * as Progress from '@radix-ui/react-progress'
import { formatDate } from '@/lib/utils'

export function ActiveJobs() {
  const router = useRouter()
  
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tutorialAPI.getDashboardStats(),
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const isLoading = dashboardLoading || projectsLoading

  // Use active jobs from dashboard data, fallback to filtering projects
  const activeJobs = dashboardData?.active_jobs?.slice(0, 5) || 
    projects.filter(project => 
      project.status === 'pending' || 
      project.status === 'processing' || 
      (project.status === 'completed' && new Date().getTime() - new Date(project.completed_at!).getTime() < 60000)
    ).slice(0, 5)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'processing':
        return 'text-blue-600 dark:text-blue-400'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-slate-600 dark:text-slate-400'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const handleViewJob = (job: any) => {
    // If it's a dashboard active job, it has an id property for the job
    if (job.id && !job.name) {
      router.push(`/progress/${job.id}`)
    } else if (job.job_id) {
      router.push(`/progress/${job.job_id}`)
    } else {
      router.push(`/projects/${job.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Active Jobs</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  if (activeJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Active Jobs</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No active jobs</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Create a new project to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Jobs</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {activeJobs.length} active
        </span>
      </div>

      <div className="space-y-4">
        {activeJobs.map((job: any, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
            onClick={() => handleViewJob(job)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {job.name || 'Job ' + job.id}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {job.source || (job.current_step && `Current: ${job.current_step}`) || 'Processing...'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <span className="text-sm font-bold">
                {Math.min(job.progress || 0, 100)}%
              </span>
            </div>

            <Progress.Root
              className="relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-full w-full h-2 mb-2"
              value={Math.min(job.progress || 0, 100)}
            >
              <Progress.Indicator
                className={`h-full transition-all duration-500 ease-out ${getProgressColor(job.status)}`}
                style={{ width: `${Math.min(job.progress || 0, 100)}%` }}
              />
            </Progress.Root>

            {job.current_step && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {job.current_step}
              </p>
            )}

            {job.updated_at && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Updated {formatDate(job.updated_at)}
              </p>
            )}

            {job.completed_at && job.status === 'completed' && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Completed {formatDate(job.completed_at)}
              </p>
            )}

            {job.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300">
                    {job.error}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {activeJobs.some(job => job.status === 'processing' || job.status === 'pending') && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Jobs update automatically • Click to view progress
          </p>
        </div>
      )}
    </div>
  )
}