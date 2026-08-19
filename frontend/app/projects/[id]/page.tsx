'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  RefreshCw,
  FileText,
  Github,
  HardDrive,
  Calendar,
  Settings,
  Play,
  Square
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tutorialAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import toast from 'react-hot-toast'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState('overview')

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => tutorialAPI.getProject(projectId),
    refetchInterval: (query) => {
      // Refetch every 2 seconds if project is still processing
      return query.state.data?.status === 'processing' ? 2000 : false
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: () => tutorialAPI.deleteProject(projectId),
    onSuccess: () => {
      toast.success('Project deleted successfully')
      router.push('/projects')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete project')
    },
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
  }

  const handleDownload = async (format: 'markdown' | 'pdf' | 'html') => {
    if (!project) return
    
    try {
      let blob: Blob
      
      if (format === 'pdf') {
        // Use the new PDF download endpoint
        blob = await tutorialAPI.downloadProjectPDF(projectId)
      } else {
        // Use the existing export endpoint for other formats
        blob = await tutorialAPI.exportTutorial(projectId, format)
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.name}-tutorial.${format === 'markdown' ? 'md' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(`Downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">Project not found</p>
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

  const getStatusIcon = () => {
    switch (project.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
    }
  }

  const getStatusColor = () => {
    switch (project.status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'processing':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
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
                  <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                  <p className="text-slate-600 dark:text-slate-400">{project.source}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created {formatDate(project.created_at)}
                </div>
                {project.completed_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed {formatDate(project.completed_at)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {project.status === 'completed' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload('markdown')}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    MD
                  </button>
                  <button
                    onClick={() => handleDownload('html')}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    HTML
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              )}
              
              <button
                onClick={() => deleteProjectMutation.mutate()}
                disabled={deleteProjectMutation.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h2 className={`text-lg font-semibold ${getStatusColor()}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </h2>
                {project.current_step && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {project.current_step}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.min(project.progress || 0, 100)}%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Progress</div>
            </div>
          </div>

          <Progress.Root
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-3"
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

          {project.error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{project.error}</p>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 mb-6">
            <Tabs.Trigger
              value="overview"
              className="flex-1 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="config"
              className="flex-1 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800"
            >
              Configuration
            </Tabs.Trigger>
            {project.status === 'completed' && (
              <Tabs.Trigger
                value="results"
                className="flex-1 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800"
              >
                Results
              </Tabs.Trigger>
            )}
          </Tabs.List>

          <AnimatePresence mode="wait">
            <Tabs.Content key="overview" value="overview">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-xl font-semibold mb-4">Project Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Name</label>
                      <p className="">{project.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Type</label>
                      <p className="capitalize">{project.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Source</label>
                      <p className="break-all">{project.source}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status</label>
                      <p className={`capitalize ${getStatusColor()}`}>{project.status}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tabs.Content>

            <Tabs.Content key="config" value="config">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Project Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Language</label>
                    <p className="">{project.config.language || 'English'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Max File Size</label>
                    <p className="">{project.config.max_file_size?.toLocaleString()} bytes</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Max Abstractions</label>
                    <p className="">{project.config.max_abstractions}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cache Enabled</label>
                    <p className="">{project.config.use_cache ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {project.config.include_patterns && (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                      Include Patterns
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {project.config.include_patterns.map((pattern, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.config.exclude_patterns && (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                      Exclude Patterns
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {project.config.exclude_patterns.map((pattern, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </Tabs.Content>

            {project.status === 'completed' && (
              <Tabs.Content key="results" value="results">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Tutorial Results
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <p className="">Tutorial content will be displayed here</p>
                      <p className="text-sm">Use the download buttons above to export the tutorial</p>
                    </div>
                  </div>
                </motion.div>
              </Tabs.Content>
            )}
          </AnimatePresence>
        </Tabs.Root>
      </div>
    </div>
  )
}