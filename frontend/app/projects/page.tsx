'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter, Search, Github, HardDrive, Clock, CheckCircle, XCircle, MoreVertical, Eye, Trash2, Home, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tutorialAPI, type Project } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import * as Progress from '@radix-ui/react-progress'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
    refetchInterval: 1000, // Refresh every second
    refetchOnWindowFocus: true,
  })

  // Auto-refresh every second for active projects
  useEffect(() => {
    const hasActiveProjects = projects.some(project => 
      project.status === 'processing' || project.status === 'pending'
    )
    
    if (hasActiveProjects) {
      const interval = setInterval(() => {
        refetch()
        setLastRefresh(new Date())
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [projects, refetch])

  const handleManualRefresh = () => {
    refetch()
    setLastRefresh(new Date())
    toast.success('Projects refreshed')
  }

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => tutorialAPI.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project')
    },
  })

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-barlow">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      {/* Navigation Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Go to Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-barlow text-slate-600 dark:text-slate-400">
                Projects
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh Projects"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className={`w-2 h-2 rounded-full ${
                  projects.some(p => p.status === 'processing' || p.status === 'pending')
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-slate-400'
                }`}></div>
                {projects.some(p => p.status === 'processing' || p.status === 'pending')
                  ? 'Auto-refreshing'
                  : `Last updated: ${lastRefresh.toLocaleTimeString()}`
                }
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-barlow font-bold tracking-tight">Projects</h1>
              <p className="text-slate-600 dark:text-slate-400 font-barlow">
                Manage your tutorial generation projects ({projects.length} total)
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/new-project')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-barlow font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              New Project
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-barlow font-semibold mb-2">No projects found</h3>
            <p className="text-slate-600 dark:text-slate-400 font-barlow mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'No projects match your search criteria'
                : 'Get started by creating your first tutorial project'
              }
            </p>
            <button
              onClick={() => router.push('/new-project')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-barlow font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Project Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
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
                        <h3 className="font-barlow font-semibold text-lg">{project.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-barlow truncate max-w-48">
                          {project.source}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 min-w-[180px]">
                          {(project.status === 'processing' || project.status === 'pending') && project.job_id && (
                            <>
                              <DropdownMenu.Item 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer font-barlow"
                                onClick={() => router.push(`/progress/${project.job_id}`)}
                              >
                                <Clock className="w-4 h-4" />
                                View Progress
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                            </>
                          )}
                          <DropdownMenu.Item 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer font-barlow"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </DropdownMenu.Item>
                          {project.status === 'completed' && (
                            <>
                              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                              <DropdownMenu.Item 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer font-barlow text-green-600 dark:text-green-400"
                                onClick={() => window.open(`http://localhost:8000/projects/${project.id}/download/pdf`, '_blank')}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                Download PDF
                              </DropdownMenu.Item>
                            </>
                          )}
                          <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                          <DropdownMenu.Item 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer font-barlow text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {project.status === 'completed' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-barlow text-green-600 dark:text-green-400">
                            Completed
                          </span>
                        </>
                      )}
                      {project.status === 'processing' && (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-sm font-barlow text-yellow-600 dark:text-yellow-400">
                            Processing
                          </span>
                        </>
                      )}
                      {project.status === 'failed' && (
                        <>
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-barlow text-red-600 dark:text-red-400">
                            Failed
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-sm font-barlow font-semibold">
                      {Math.min(project.progress || 0, 100)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <Progress.Root
                    className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-full w-full h-2 mb-4"
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

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 font-barlow mb-4">
                    <span>Created {formatDate(project.created_at)}</span>
                    {project.status === 'completed' && project.completed_at && (
                      <span>Completed {formatDate(project.completed_at)}</span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {project.status === 'processing' || project.status === 'pending' ? (
                      <button
                        onClick={() => project.job_id && router.push(`/progress/${project.job_id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-barlow rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        View Progress
                      </button>
                    ) : project.status === 'completed' ? (
                      <>
                        <button
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-barlow rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:8000/projects/${project.id}/download/pdf`, '_blank')}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-barlow rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-barlow rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Statistics Footer */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-barlow font-bold text-blue-600 dark:text-blue-400">
                  {projects.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-barlow">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-barlow font-bold text-green-600 dark:text-green-400">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-barlow">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-barlow font-bold text-yellow-600 dark:text-yellow-400">
                  {projects.filter(p => p.status === 'processing' || p.status === 'pending').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-barlow">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-barlow font-bold text-red-600 dark:text-red-400">
                  {projects.filter(p => p.status === 'failed').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-barlow">Failed</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-barlow"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/new-project')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-barlow"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Auto-refresh: {projects.some(p => p.status === 'processing' || p.status === 'pending') ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-6">
            <Dialog.Title className="text-xl font-barlow font-bold mb-4">
              Delete Project
            </Dialog.Title>
            <Dialog.Description className="text-slate-600 dark:text-slate-400 font-barlow mb-6">
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone and will permanently remove all generated content.
            </Dialog.Description>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-barlow font-semibold transition-colors disabled:opacity-50"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}