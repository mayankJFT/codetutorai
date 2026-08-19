'use client'

import { motion } from 'framer-motion'
import { Github, HardDrive, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import * as Progress from '@radix-ui/react-progress'
import { useQuery } from '@tanstack/react-query'
import { tutorialAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

export function RecentProjects() {
  const router = useRouter()
  
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => tutorialAPI.getProjects(),
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tutorialAPI.getDashboardStats(),
    refetchInterval: 30000,
  })

  // Use recent activity from dashboard data, fallback to projects
  const recentProjects = dashboardData?.recent_activity?.slice(0, 4) || projects.slice(0, 4)

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">Recent Projects</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your latest tutorial generation projects
          </p>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold">Recent Projects</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your latest tutorial generation projects
        </p>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {recentProjects.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              No projects yet. Create your first tutorial!
            </p>
          </div>
        ) : (
          recentProjects.map((project: any) => (
            <div key={project.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    project.type === 'github' 
                      ? 'bg-slate-900 dark:bg-slate-700' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {project.type === 'github' ? (
                      <Github className="w-5 h-5 text-white dark:text-slate-200" />
                    ) : (
                      <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {project.source}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(project.created_at)}
                      </span>
                      {project.config?.language && (
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {project.config.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.status === 'completed' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Completed
                        </span>
                      </>
                    )}
                    {(project.status === 'processing' || project.status === 'pending') && (
                      <>
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          {project.current_step || (project.status === 'pending' ? 'Pending' : 'Processing')}
                        </span>
                      </>
                    )}
                    {project.status === 'failed' && (
                      <>
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {project.error || 'Failed'}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {Math.min(project.progress || 0, 100)}%
                  </span>
                </div>

                <Progress.Root
                  className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2"
                  value={Math.min(project.progress || 0, 100)}
                >
                  <Progress.Indicator
                    className={`h-full transition-all duration-500 ease-out ${
                      project.status === 'completed' ? 'bg-green-500' :
                      project.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
                  />
                </Progress.Root>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => router.push('/projects')}
          className="w-full py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          View All Projects
        </button>
      </div>
    </motion.div>
  )
}