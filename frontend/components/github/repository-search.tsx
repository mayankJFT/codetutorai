'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, GitFork, Calendar, ExternalLink, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { githubAPI, type GitHubSearchParams, type GitHubRepo } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import * as Dialog from '@radix-ui/react-dialog'

interface RepositorySearchProps {
  onSelect?: (repo: GitHubRepo) => void
}

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 
  'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'Shell', 'HTML', 'CSS'
]

export function RepositorySearch({ onSelect }: RepositorySearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<GitHubSearchParams>({
    query: '',
    language: '',
    sort: 'stars',
    order: 'desc',
    per_page: 10,
  })
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchParams.query)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchParams.query])

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['github-search', debouncedQuery, searchParams.language, searchParams.sort],
    queryFn: () => githubAPI.searchRepositories({ ...searchParams, query: debouncedQuery }),
    enabled: debouncedQuery.trim().length > 2,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })

  const handleRepoSelect = (repo: GitHubRepo) => {
    onSelect?.(repo)
    setIsOpen(false)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-barlow">
          <Search className="w-4 h-4" />
          Search GitHub Repositories
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Dialog.Title className="text-2xl font-barlow font-bold mb-4">
              Search GitHub Repositories
            </Dialog.Title>

            {/* Search Form */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchParams.query}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={searchParams.language}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, language: e.target.value }))}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Languages</option>
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <select
                  value={searchParams.sort}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, sort: e.target.value }))}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="stars">Sort by Stars</option>
                  <option value="forks">Sort by Forks</option>
                  <option value="updated">Sort by Updated</option>
                </select>
                <select
                  value={searchParams.order}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, order: e.target.value }))}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-barlow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
            {isLoading && debouncedQuery && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 font-barlow">Searching repositories...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 font-barlow">
                  Failed to search repositories. Please try again.
                </p>
              </div>
            )}

            {!debouncedQuery.trim() && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-barlow">
                  Enter a search query to find repositories
                </p>
              </div>
            )}

            {searchResults && searchResults.repositories.length === 0 && debouncedQuery.trim() && (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 font-barlow">
                  No repositories found for "{debouncedQuery}"
                </p>
              </div>
            )}

            <AnimatePresence>
              {searchResults?.repositories.map((repo, index) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-barlow font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        {repo.full_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-barlow mb-3 line-clamp-2">
                        {repo.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {onSelect && (
                        <button
                          onClick={() => handleRepoSelect(repo)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-barlow">
                    {repo.language && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {repo.language}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {repo.stars.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      {repo.forks.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Updated {formatDate(repo.updated_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {searchResults && searchResults.repositories.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-barlow">
                  Showing {searchResults.repositories.length} of {searchResults.total_count.toLocaleString()} results
                </p>
              </div>
            )}
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}