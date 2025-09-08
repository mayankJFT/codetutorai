'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { tutorialAPI } from '@/lib/api'

// Generate mock weekly data based on current projects if no real data is available
const generateWeeklyData = (projects: any[] = []) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date()
  
  return days.map((day, index) => {
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() - (6 - index))
    
    // Filter projects created on this day
    const dayProjects = projects.filter(project => {
      const projectDate = new Date(project.created_at)
      return projectDate.toDateString() === dayDate.toDateString()
    })
    
    return {
      name: day,
      completed: dayProjects.filter(p => p.status === 'completed').length,
      failed: dayProjects.filter(p => p.status === 'failed').length,
      processing: dayProjects.filter(p => p.status === 'processing').length,
    }
  })
}

export function ActivityChart() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => tutorialAPI.getProjects(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const data = generateWeeklyData(projects)

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
      >
        <div className="mb-6">
          <h2 className="text-xl font-barlow font-bold">Weekly Activity</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-barlow">
            Tutorial generation activity over the past week
          </p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const totalCompleted = data.reduce((sum, day) => sum + day.completed, 0)
  const totalFailed = data.reduce((sum, day) => sum + day.failed, 0)
  const totalProcessing = data.reduce((sum, day) => sum + day.processing, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-barlow font-bold">Weekly Activity</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-barlow">
          Tutorial generation activity over the past week
        </p>
        {totalCompleted + totalFailed + totalProcessing > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-barlow mt-1">
            {totalCompleted + totalFailed + totalProcessing} total projects this week
          </p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis 
            dataKey="name" 
            className="font-barlow"
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <YAxis 
            className="font-barlow"
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'Barlow Condensed',
            }}
          />
          <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="processing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span className="text-sm font-barlow text-slate-600 dark:text-slate-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
          <span className="text-sm font-barlow text-slate-600 dark:text-slate-400">Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span className="text-sm font-barlow text-slate-600 dark:text-slate-400">Failed</span>
        </div>
      </div>
    </motion.div>
  )
}