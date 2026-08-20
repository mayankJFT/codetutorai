'use client'

import { useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderPlus, LayoutGrid, List, Plus, Search, SearchX } from 'lucide-react'
import toast from 'react-hot-toast'
import { tutorialAPI, type Project } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Alert } from '@/components/ui/alert'
import { Stagger, StaggerItem } from '@/components/motion'
import { ProjectCard } from '@/components/projects/project-card'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'
import { cn } from '@/lib/utils'

function ProjectsPageInner() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [toDelete, setToDelete] = useState<Project | null>(null)

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
    refetchInterval: 15000,
  })

  const del = useMutation({
    mutationFn: (id: string) => tutorialAPI.deleteProject(id),
    onSuccess: () => {
      toast.success('Project deleted')
      setToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...projects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((p) => (status === 'all' ? true : status === 'processing' ? p.status === 'processing' || p.status === 'pending' : p.status === status))
      .filter((p) => !q || p.name?.toLowerCase().includes(q) || p.source?.toLowerCase().includes(q))
  }, [projects, query, status])

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every codebase you've turned into a tutorial."
        actions={
          <Button variant="gradient" href="/new-project">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or source…" className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
          <div className="flex rounded-lg border border-border bg-card p-0.5 shadow-soft">
            <button onClick={() => setView('grid')} className={cn('rounded-md p-2 text-muted-foreground transition-colors', view === 'grid' && 'bg-accent text-accent-foreground')} aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('rounded-md p-2 text-muted-foreground transition-colors', view === 'list' && 'bg-accent text-accent-foreground')} aria-label="List view">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error" title="Couldn't load projects" action={<Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Generate your first tutorial from a GitHub repository or a local folder."
          action={<Button variant="gradient" href="/new-project"><Plus className="h-4 w-4" /> New Project</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          description={`Nothing matches “${query}”${status !== 'all' ? ` with status ${status}` : ''}.`}
          action={<Button variant="outline" onClick={() => { setQuery(''); setStatus('all') }}>Clear filters</Button>}
        />
      ) : (
        <Stagger className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-3'}>
          {filtered.map((p) => (
            <StaggerItem key={p.id}>
              <ProjectCard project={p} onDelete={setToDelete} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <DeleteProjectDialog project={toDelete} onOpenChange={(open) => !open && setToDelete(null)} onConfirm={(id) => del.mutate(id)} deleting={del.isPending} />
    </>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageInner />
    </Suspense>
  )
}
