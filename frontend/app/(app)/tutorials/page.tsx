'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Languages, ListOrdered, Plus, Search, SearchX } from 'lucide-react'
import toast from 'react-hot-toast'
import { tutorialAPI, type Project } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Alert } from '@/components/ui/alert'
import { Stagger, StaggerItem } from '@/components/motion'
import { ProjectCard } from '@/components/projects/project-card'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'

export default function TutorialsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Project | null>(null)

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
  })

  const del = useMutation({
    mutationFn: (id: string) => tutorialAPI.deleteProject(id),
    onSuccess: () => {
      toast.success('Tutorial deleted')
      setToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => toast.error('Failed to delete tutorial'),
  })

  const tutorials = useMemo(
    () => projects.filter((p) => p.status === 'completed').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [projects]
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tutorials.filter((p) => !q || p.name?.toLowerCase().includes(q) || p.source?.toLowerCase().includes(q))
  }, [tutorials, query])

  const chapterCount = tutorials.reduce((acc, p) => acc + (p.result?.chapters?.length ?? 0), 0)
  const languages = new Set(tutorials.map((p) => p.config?.language ?? 'english')).size

  return (
    <>
      <PageHeader
        title="Tutorials"
        description="Finished tutorials, ready to read and export."
        actions={
          <Button variant="gradient" href="/new-project">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tutorials" value={tutorials.length} icon={BookOpen} accent="indigo" />
        <StatCard label="Chapters written" value={chapterCount} icon={ListOrdered} accent="emerald" />
        <StatCard label="Languages" value={languages} icon={Languages} accent="sky" />
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tutorials…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error" title="Couldn't load tutorials" action={<Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>} />
      ) : tutorials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No tutorials yet"
          description="Completed projects show up here as readable, exportable tutorials."
          action={<Button variant="gradient" href="/new-project"><Plus className="h-4 w-4" /> Generate your first tutorial</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No matches" description={`Nothing matches “${query}”.`} action={<Button variant="outline" onClick={() => setQuery('')}>Clear search</Button>} />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
