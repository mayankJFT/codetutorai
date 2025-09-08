'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { Github, HardDrive, Globe, Info, Plus, X, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { tutorialAPI, type ProjectConfig, type GitHubRepo } from '@/lib/api'
import { RepositorySearch } from '@/components/github/repository-search'
import toast from 'react-hot-toast'

const DEFAULT_INCLUDE_PATTERNS = [
  '*.py', '*.js', '*.jsx', '*.ts', '*.tsx', '*.go', '*.java',
  '*.c', '*.cpp', '*.h', '*.md', '*.yaml', '*.yml'
]

const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/*', '.git/*', 'dist/*', 'build/*', '*test*', 
  'docs/*', 'venv/*', '.venv/*', '*.log'
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Korean'
]

export function ProjectForm() {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<'github' | 'local'>('github')
  const [config, setConfig] = useState<ProjectConfig>({
    repo_url: '',
    local_dir: '',
    project_name: '',
    github_token: '',
    include_patterns: DEFAULT_INCLUDE_PATTERNS,
    exclude_patterns: DEFAULT_EXCLUDE_PATTERNS,
    max_file_size: 100000,
    language: 'English',
    use_cache: true,
    max_abstractions: 10,
  })

  const [newIncludePattern, setNewIncludePattern] = useState('')
  const [newExcludePattern, setNewExcludePattern] = useState('')

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectConfig) => tutorialAPI.createProject(data),
    onSuccess: (data) => {
      toast.success('Tutorial generation started!')
      router.push(`/progress/${data.job_id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create project')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalConfig: ProjectConfig = {
      ...config,
      repo_url: sourceType === 'github' ? config.repo_url : undefined,
      local_dir: sourceType === 'local' ? config.local_dir : undefined,
    }

    createProjectMutation.mutate(finalConfig)
  }

  const handleGitHubRepoSelect = (repo: GitHubRepo) => {
    setConfig(prev => ({
      ...prev,
      repo_url: repo.clone_url,
      project_name: repo.name,
    }))
    setSourceType('github')
    toast.success(`Selected repository: ${repo.full_name}`)
  }

  const addPattern = (type: 'include' | 'exclude') => {
    const pattern = type === 'include' ? newIncludePattern : newExcludePattern
    if (!pattern) return

    if (type === 'include') {
      setConfig(prev => ({
        ...prev,
        include_patterns: [...(prev.include_patterns || []), pattern]
      }))
      setNewIncludePattern('')
    } else {
      setConfig(prev => ({
        ...prev,
        exclude_patterns: [...(prev.exclude_patterns || []), pattern]
      }))
      setNewExcludePattern('')
    }
  }

  const removePattern = (type: 'include' | 'exclude', index: number) => {
    if (type === 'include') {
      setConfig(prev => ({
        ...prev,
        include_patterns: prev.include_patterns?.filter((_, i) => i !== index)
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        exclude_patterns: prev.exclude_patterns?.filter((_, i) => i !== index)
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source Type Tabs */}
      <Tabs.Root value={sourceType} onValueChange={(v) => setSourceType(v as 'github' | 'local')}>
        <Tabs.List className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Tabs.Trigger
            value="github"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md font-barlow font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <Github className="w-5 h-5" />
            GitHub Repository
          </Tabs.Trigger>
          <Tabs.Trigger
            value="local"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md font-barlow font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <HardDrive className="w-5 h-5" />
            Local Directory
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <Tabs.Content value="github" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-barlow font-semibold">
                  Repository URL <span className="text-red-500">*</span>
                </label>
                <RepositorySearch onSelect={handleGitHubRepoSelect} />
              </div>
              <input
                type="text"
                value={config.repo_url}
                onChange={(e) => setConfig(prev => ({ ...prev, repo_url: e.target.value }))}
                placeholder="https://github.com/owner/repository"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                required={sourceType === 'github'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-barlow">
                Enter repository URL manually or use the search button to find public repositories
              </p>
            </div>

            <div>
              <label className="block text-sm font-barlow font-semibold mb-2">
                GitHub Token (Optional)
              </label>
              <input
                type="password"
                value={config.github_token}
                onChange={(e) => setConfig(prev => ({ ...prev, github_token: e.target.value }))}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-barlow">
                Required for private repositories and to avoid rate limits
              </p>
            </div>
          </Tabs.Content>

          <Tabs.Content value="local" className="space-y-4">
            <div>
              <label className="block text-sm font-barlow font-semibold mb-2">
                Directory Path <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.local_dir}
                onChange={(e) => setConfig(prev => ({ ...prev, local_dir: e.target.value }))}
                placeholder="/path/to/your/codebase"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                required={sourceType === 'local'}
              />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>

      {/* Project Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="text-lg font-barlow font-bold mb-4">Project Configuration</h3>

        <div>
          <label className="block text-sm font-barlow font-semibold mb-2">
            Project Name (Optional)
          </label>
          <input
            type="text"
            value={config.project_name}
            onChange={(e) => setConfig(prev => ({ ...prev, project_name: e.target.value }))}
            placeholder="My Awesome Project"
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-barlow font-semibold mb-2">
              Language
            </label>
            <select
              value={config.language}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-barlow font-semibold mb-2">
              Max Abstractions
            </label>
            <input
              type="number"
              min="5"
              max="20"
              value={config.max_abstractions}
              onChange={(e) => setConfig(prev => ({ ...prev, max_abstractions: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-barlow font-semibold mb-2">
            Max File Size (bytes)
          </label>
          <input
            type="number"
            value={config.max_file_size}
            onChange={(e) => setConfig(prev => ({ ...prev, max_file_size: parseInt(e.target.value) }))}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-barlow font-semibold">
              Enable LLM Caching
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-barlow">
              Cache responses to speed up regeneration
            </p>
          </div>
          <Switch.Root
            checked={config.use_cache}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_cache: checked }))}
            className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-blue-500 transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
          </Switch.Root>
        </div>
      </div>

      {/* File Patterns */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="text-lg font-barlow font-bold mb-4">File Patterns</h3>

        {/* Include Patterns */}
        <div>
          <label className="block text-sm font-barlow font-semibold mb-2">
            Include Patterns
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newIncludePattern}
              onChange={(e) => setNewIncludePattern(e.target.value)}
              placeholder="*.py"
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPattern('include'))}
            />
            <button
              type="button"
              onClick={() => addPattern('include')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.include_patterns?.map((pattern, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-barlow"
              >
                {pattern}
                <button
                  type="button"
                  onClick={() => removePattern('include', i)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Exclude Patterns */}
        <div>
          <label className="block text-sm font-barlow font-semibold mb-2">
            Exclude Patterns
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newExcludePattern}
              onChange={(e) => setNewExcludePattern(e.target.value)}
              placeholder="test/*"
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPattern('exclude'))}
            />
            <button
              type="button"
              onClick={() => addPattern('exclude')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.exclude_patterns?.map((pattern, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-barlow"
              >
                {pattern}
                <button
                  type="button"
                  onClick={() => removePattern('exclude', i)}
                  className="hover:text-red-900 dark:hover:text-red-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createProjectMutation.isPending}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-barlow font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createProjectMutation.isPending ? 'Creating...' : 'Generate Tutorial'}
        </button>
      </div>
    </form>
  )
}