'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  Sparkles,
  BookOpen,
  Cog,
  FileText,
  Zap,
  Home
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tutorialAPI } from '@/lib/api'
import * as Progress from '@radix-ui/react-progress'
import toast from 'react-hot-toast'

const PROGRESS_STEPS = [
  { step: 'Fetching repository', icon: Download, color: 'blue', range: [0, 15] },
  { step: 'Identifying abstractions', icon: Sparkles, color: 'purple', range: [15, 30] },
  { step: 'Analyzing relationships', icon: Cog, color: 'green', range: [30, 45] },
  { step: 'Ordering chapters', icon: BookOpen, color: 'yellow', range: [45, 55] },
  { step: 'Writing chapters', icon: FileText, color: 'indigo', range: [55, 85] },
  { step: 'Combining tutorial', icon: Zap, color: 'pink', range: [85, 100] }
]

export default function ProgressPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.jobId as string
  
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  // Use SSE for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null
    
    const connectSSE = async () => {
      try {
        // Get initial status
        const initialStatus = await tutorialAPI.getJobStatus(jobId)
        setJobStatus(initialStatus)
        setIsLoading(false)
        
        // If job is still in progress, connect to SSE
        if (initialStatus.status === 'processing' || initialStatus.status === 'pending') {
          const token = localStorage.getItem('token')
          if (token) {
            eventSource = new EventSource(`http://localhost:8000/status/${jobId}/stream?token=${encodeURIComponent(token)}`)
            
            eventSource.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                setJobStatus(data)
                
                // Stop SSE if job is complete
                if (data.status === 'completed' || data.status === 'failed') {
                  eventSource?.close()
                  setAutoRefresh(false)
                }
              } catch (err) {
              }
            }
            
            eventSource.onerror = (err) => {
              eventSource?.close()
              // Fallback to polling
              setAutoRefresh(true)
            }
          }
        }
      } catch (err) {
        setError(err)
        setIsLoading(false)
      }
    }
    
    connectSSE()
    
    return () => {
      eventSource?.close()
    }
  }, [jobId])

  // Fallback polling when SSE is not available
  const { data: polledJobStatus } = useQuery({
    queryKey: ['job-status-poll', jobId],
    queryFn: () => tutorialAPI.getJobStatus(jobId),
    refetchInterval: autoRefresh && !jobStatus && !timeoutReached ? 3000 : false,
    enabled: autoRefresh && !jobStatus,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
  })

  // Use polled data as fallback
  useEffect(() => {
    if (polledJobStatus && !jobStatus) {
      setJobStatus(polledJobStatus)
      setIsLoading(false)
    }
  }, [polledJobStatus, jobStatus])

  // Add timeout for stuck jobs
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (jobStatus?.status === 'processing' && jobStatus?.progress >= 80) {
        setTimeoutReached(true)
      }
    }, 120000) // 2 minutes timeout for jobs stuck at high progress

    return () => clearTimeout(timeout)
  }, [jobStatus?.status, jobStatus?.progress])

  // Stop auto-refresh when job is complete or failed
  useEffect(() => {
    if (jobStatus && (jobStatus.status === 'completed' || jobStatus.status === 'failed')) {
      setAutoRefresh(false)
    }
  }, [jobStatus?.status])

  // Redirect to project page when completed
  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.result) {
      // Show success message and redirect after a short delay
      setTimeout(() => {
        toast.success('Tutorial generated successfully!')
        router.push('/projects')
      }, 2000)
    }
  }, [jobStatus?.status, jobStatus?.result, router])

  const handleManualRefresh = async () => {
    try {
      const refreshedStatus = await tutorialAPI.getJobStatus(jobId)
      setJobStatus(refreshedStatus)
    } catch (err) {
    }
  }

  const handleViewProjects = () => {
    router.push('/projects')
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleNewProject = () => {
    router.push('/new-project')
  }

  const handleDownloadPDF = async () => {
    if (jobStatus?.result) {
      try {
        // Find the project by job_id to get project_id
        const projects = await tutorialAPI.getProjects()
        const project = projects.find(p => p.job_id === jobId)
        
        if (project) {
          const blob = await tutorialAPI.downloadProjectPDF(project.id)
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${project.name || 'tutorial'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toast.success('PDF downloaded successfully!')
        }
      } catch (error) {
        toast.error('Failed to download PDF')
      }
    }
  }

  const getStatusIcon = () => {
    switch (jobStatus?.status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      case 'processing':
        return <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      default:
        return <Clock className="w-8 h-8 text-slate-600 dark:text-slate-400" />
    }
  }

  const getStatusColor = () => {
    switch (jobStatus?.status) {
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

  const getProgressBarColor = () => {
    switch (jobStatus?.status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading job status...</p>
        </div>
      </div>
    )
  }

  if (error || !jobStatus) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">Failed to load job status</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Top Row - Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoHome}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Go to Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => router.push('/projects')}
                className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm"
              >
                Projects
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Progress
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tutorial Generation Progress</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Job ID: {jobId.substring(0, 8)}...
              </p>
            </div>

            <div className="flex items-center gap-2">
              {jobStatus.status === 'completed' && (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleViewProjects}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Projects
                  </button>
                </>
              )}
              
              {jobStatus.status === 'failed' && (
                <button
                  onClick={handleNewProject}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Try Again
                </button>
              )}

              {jobStatus.status === 'pending' && (
                <button
                  onClick={() => router.push('/projects')}
                  className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Projects
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h2 className={`text-2xl font-bold ${getStatusColor()}`}>
                  {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                </h2>
                {jobStatus.current_step && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                    {jobStatus.current_step}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{Math.min(jobStatus.progress || 0, 100)}%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress.Root
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-4 mb-6"
            value={Math.min(jobStatus.progress || 0, 100)}
          >
            <Progress.Indicator
              className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
              style={{ width: `${Math.min(jobStatus.progress || 0, 100)}%` }}
            />
          </Progress.Root>

          {/* Timeout Warning */}
          {timeoutReached && jobStatus.status === 'processing' && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                    Job May Be Taking Longer Than Expected
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    This job has been running for a while. The tutorial generation might have completed successfully. 
                    Try checking your projects page or refreshing manually.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewProjects}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                    >
                      Check Projects
                    </button>
                    <button
                      onClick={() => {
                        setTimeoutReached(false)
                        setAutoRefresh(true)
                        handleManualRefresh()
                      }}
                      className="px-3 py-1 border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 rounded text-sm transition-colors"
                    >
                      Continue Monitoring
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {jobStatus.error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {jobStatus.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {jobStatus.status === 'completed' && jobStatus.result && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                    Tutorial Generated Successfully!
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {jobStatus.result.abstractions?.length || 0}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">Concepts</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {jobStatus.result.chapters?.length || 0}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">Chapters</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        100%
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">Complete</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Generation Steps</h3>
          <div className="space-y-4">
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = jobStatus.current_step === step.step
              const isCompleted = jobStatus.progress >= step.range[1]
              const isInProgress = jobStatus.progress >= step.range[0] && jobStatus.progress < step.range[1]
              const StepIcon = step.icon

              // Calculate step progress for the current step
              const stepProgress = isActive || isInProgress 
                ? Math.min(100, Math.max(0, ((jobStatus.progress - step.range[0]) / (step.range[1] - step.range[0])) * 100))
                : isCompleted ? 100 : 0

              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    isActive || isInProgress
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`p-3 rounded-full ${
                    isActive || isInProgress
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {isCompleted && !isActive && !isInProgress ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (isActive || isInProgress) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${
                        isActive || isInProgress
                          ? 'text-blue-700 dark:text-blue-300'
                          : isCompleted
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {step.step}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {Math.round(stepProgress)}%
                      </span>
                    </div>
                    {(isActive || isInProgress) && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stepProgress}%` }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isCompleted
                        ? 'Completed'
                        : (isActive || isInProgress)
                        ? 'In Progress'
                        : 'Pending'
                      }
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Real-time Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Backend Logs</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className={`w-2 h-2 rounded-full ${
                (jobStatus.status === 'processing' || jobStatus.status === 'pending') && autoRefresh
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-slate-400'
              }`}></div>
              {(jobStatus.status === 'processing' || jobStatus.status === 'pending') && autoRefresh
                ? 'Live Updates'
                : 'Static'
              }
            </div>
          </div>
          
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 max-h-80 overflow-y-auto">
            <div className="space-y-2 font-mono text-sm">
              {jobStatus.logs && jobStatus.logs.length > 0 ? (
                [...jobStatus.logs].reverse().map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-slate-300"
                  >
                    <span className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.level === 'ERROR' ? 'bg-red-900 text-red-200' :
                      log.level === 'WARN' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-400 text-xs">
                      [{log.step}]
                    </span>
                    <span className="text-slate-300 flex-1">
                      {log.message}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {Math.min(log.progress || 0, 100)}%
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-8">
                  No logs available yet...
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Navigation Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/projects')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                My Projects
              </button>
            </div>

            <div className="flex items-center gap-2">
              {jobStatus.status !== 'completed' && jobStatus.status !== 'failed' && (
                <button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Start New Project
                </button>
              )}
              
              {jobStatus.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Tutorial ready!
                  </span>
                  <button
                    onClick={handleViewProjects}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    View & Manage
                  </button>
                </div>
              )}
              
              {jobStatus.status === 'failed' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500 dark:text-red-400">
                    Generation failed
                  </span>
                  <button
                    onClick={handleNewProject}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}