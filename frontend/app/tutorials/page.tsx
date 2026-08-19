'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Share2, 
  Star, 
  StarIcon,
  Calendar,
  Github,
  HardDrive,
  FileText,
  Code,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { tutorialAPI, type Project } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import toast from 'react-hot-toast'

type ViewMode = 'grid' | 'list'
type FilterOption = 'all' | 'completed' | 'recent' | 'starred'

export default function TutorialsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [starredTutorials, setStarredTutorials] = useState<Set<string>>(new Set())

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
  })

  // Filter to only completed projects (these have tutorials)
  const completedProjects = projects.filter(project => project.status === 'completed')

  // Filter and sort tutorials
  const filteredTutorials = completedProjects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.source.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = 
        filterBy === 'all' ? true :
        filterBy === 'completed' ? true : // Already filtered to completed
        filterBy === 'recent' ? new Date(project.completed_at!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 :
        filterBy === 'starred' ? starredTutorials.has(project.id) :
        true
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  const toggleStar = (projectId: string) => {
    const newStarred = new Set(starredTutorials)
    if (newStarred.has(projectId)) {
      newStarred.delete(projectId)
      toast.success('Removed from favorites')
    } else {
      newStarred.add(projectId)
      toast.success('Added to favorites')
    }
    setStarredTutorials(newStarred)
  }

  const handleDownload = async (project: Project, format: 'markdown' | 'pdf' | 'html') => {
    try {
      let blob: Blob
      
      if (format === 'pdf') {
        // Use the new PDF download endpoint
        blob = await tutorialAPI.downloadProjectPDF(project.id)
      } else {
        // Use the existing export endpoint for other formats
        blob = await tutorialAPI.exportTutorial(project.id, format)
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.name}-tutorial.${format === 'markdown' ? 'md' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(`Downloaded ${project.name} as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to download tutorial`)
    }
  }

  const handleShare = (project: Project) => {
    const url = `${window.location.origin}/projects/${project.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading tutorials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Generated Tutorials</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Browse, read, and manage your generated tutorials
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {completedProjects.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Tutorials</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {completedProjects.filter(p => p.type === 'github').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">GitHub Repos</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedProjects.filter(p => new Date(p.completed_at!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">This Week</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {starredTutorials.size}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Starred</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tutorials</option>
              <option value="recent">Recent (7 days)</option>
              <option value="starred">Starred</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm' 
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm' 
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tutorials */}
        {filteredTutorials.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tutorials found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery || filterBy !== 'all' 
                ? 'No tutorials match your search criteria'
                : completedProjects.length === 0
                ? 'You haven\'t generated any tutorials yet'
                : 'Complete some projects to see tutorials here'
              }
            </p>
            <button
              onClick={() => router.push('/new-project')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Generate Your First Tutorial
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Tutorial Card Header */}
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
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-48">
                          {project.source}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleStar(project.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      {starredTutorials.has(project.id) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Tutorial Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Generated {formatDate(project.completed_at!)}</span>
                      <span className="flex items-center gap-1">
                        <Code className="w-4 h-4" />
                        {project.config.language || 'English'}
                      </span>
                    </div>
                    
                    {project.result && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {project.result.abstractions?.length || 0} concepts • {project.result.chapters?.length || 0} chapters
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Read Tutorial
                    </button>
                    
                    <button
                      onClick={() => handleDownload(project, 'markdown')}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Download as Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleShare(project)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Share Tutorial"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTutorials.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
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
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <button
                          onClick={() => toggleStar(project.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          {starredTutorials.has(project.id) ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {project.source}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>Generated {formatDate(project.completed_at!)}</span>
                        <span>{project.config.language || 'English'}</span>
                        {project.result && (
                          <span>{project.result.abstractions?.length || 0} concepts</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(project, 'markdown')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleShare(project)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
                    >
                      Read Tutorial
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}