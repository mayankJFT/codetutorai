'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GitFork, Search, Star } from 'lucide-react'
import { githubAPI, type GitHubRepo } from '@/lib/api'
import { relativeTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const LANGS = ['', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++']

export function RepositorySearchDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; onSelect: (repo: GitHubRepo) => void }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [language, setLanguage] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['github-search', debounced, language],
    queryFn: () => githubAPI.searchRepositories({ query: debounced, language: language || undefined, sort: 'stars', order: 'desc', per_page: 12 }),
    enabled: open && debounced.length >= 2,
    staleTime: 60_000,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Browse GitHub</DialogTitle>
          <DialogDescription>Search public repositories and pick one to generate a tutorial from.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. fastapi, pocketflow, tokio…" className="pl-9" />
          </div>
          <div className="w-40">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGS.map((l) => (
                <option key={l} value={l}>{l || 'Any language'}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="max-h-[50vh] min-h-[200px] overflow-y-auto rounded-lg border border-border">
          {debounced.length < 2 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Type at least two characters to search.</p>
          ) : isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-3">
              <Alert variant="error" title="Search failed">GitHub rate-limits unauthenticated search. Add a token in Settings → Integrations and try again.</Alert>
            </div>
          ) : !data?.repositories?.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No repositories found for “{debounced}”.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.repositories.map((repo) => (
                <li key={repo.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(repo); onOpenChange(false) }}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{repo.full_name}</p>
                      {repo.language && <Badge variant="outline" className="font-normal">{repo.language}</Badge>}
                    </div>
                    {repo.description && <p className="line-clamp-2 text-xs text-muted-foreground">{repo.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stars?.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {repo.forks?.toLocaleString()}</span>
                      {repo.updated_at && <span>Updated {relativeTime(repo.updated_at)}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
