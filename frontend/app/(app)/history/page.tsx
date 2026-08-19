'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, Search, Filter, Calendar, Clock, CheckCircle, XCircle, Github, HardDrive, Eye, Trash2, MoreVertical } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tutorialAPI, type Project } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'

type SortOption = 'newest' | 'oldest' | 'name' | 'status'
type FilterOption = 'all' | 'completed' | 'failed' | 'github' | 'local'

export default function HistoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => tutorialAPI.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete project')
    },
  })

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.source.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = 
        filterBy === 'all' ? true :
        filterBy === 'completed' ? project.status === 'completed' :
        filterBy === 'failed' ? project.status === 'failed' :
        filterBy === 'github' ? project.type === 'github' :
        filterBy === 'local' ? project.type === 'local' :
        true
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
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

  // Statistics
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const failedProjects = projects.filter(p => p.status === 'failed').length
  const githubProjects = projects.filter(p => p.type === 'github').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading project history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project History</h1>
              <p className="text-slate-600 dark:text-slate-400">
                View and manage your previous tutorial generation projects
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalProjects}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Projects</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedProjects}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {failedProjects}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Failed</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {githubProjects}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">GitHub Repos</div>
            </div>
          </div>
        </div>

        {/* Controls */}
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Projects</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="github">GitHub</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>

        {/* Project List */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery || filterBy !== 'all' 
                ? 'No projects match your search criteria'
                : 'You haven\'t created any projects yet'
              }
            </p>
            <button
              onClick={() => router.push('/new-project')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Project Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        project.type === 'github' 
                          ? 'bg-slate-900 dark:bg-slate-700' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {project.type === 'github' ? (
                          <Github className="w-6 h-6 text-white dark:text-slate-200" />
                        ) : (
                          <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {project.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                            {project.status === 'failed' && (
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                            {project.status === 'processing' && (
                              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-2">
                          {project.source}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(project.created_at)}
                          </div>
                          {project.completed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Completed {formatDate(project.completed_at)}
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            project.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            project.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            project.status === 'processing' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 min-w-[150px] z-50">
                          <DropdownMenu.Item 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                          <DropdownMenu.Item 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-6">
            <Dialog.Title className="text-xl font-bold mb-4">
              Delete Project
            </Dialog.Title>
            <Dialog.Description className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone and will permanently remove all generated content.
            </Dialog.Description>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
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