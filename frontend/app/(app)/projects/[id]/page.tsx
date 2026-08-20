'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Boxes, Github, HardDrive, Languages, ListOrdered, Network, RefreshCcw } from 'lucide-react'
import { tutorialAPI } from '@/lib/api'
import { relativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/projects/status-badge'
import { ExportMenu } from '@/components/tutorial/export-menu'
import { ChapterNav } from '@/components/tutorial/chapter-nav'
import { chapterTitle, Markdown } from '@/components/tutorial/markdown'
import { PipelineViz } from '@/components/progress/pipeline-viz'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [chapter, setChapter] = useState(0)

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => tutorialAPI.getProject(projectId),
    refetchInterval: (q) => (q.state.data?.status === 'processing' || q.state.data?.status === 'pending' ? 5000 : false),
  })

  const chapters = useMemo(() => project?.result?.chapters ?? [], [project])
  const titles = useMemo(() => chapters.map((c, i) => chapterTitle(c, `Chapter ${i + 1}`)), [chapters])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [chapter])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/2 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <Alert variant="error" title="Project not found" action={<Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCcw className="h-3.5 w-3.5" /> Retry</Button>}>
        This project doesn't exist or you don't have access to it.
      </Alert>
    )
  }

  const SourceIcon = project.type === 'github' ? Github : HardDrive
  const abstractions = project.result?.abstractions ?? []
  const relationships = project.result?.relationships

  return (
    <>
      <PageHeader
        title={project.name}
        description={
          <span className="flex items-center gap-1.5">
            <SourceIcon className="h-3.5 w-3.5" /> {project.source}
          </span>
        }
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.status === 'completed' && <ExportMenu project={project} />}
          </div>
        }
      />

      {project.status !== 'completed' ? (
        <Card>
          <CardHeader>
            <CardTitle>{project.status === 'failed' ? 'Generation failed' : 'Still generating'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PipelineViz currentStep={project.current_step} progress={Number(project.progress) || 0} status={project.status} />
            {project.status === 'failed' ? (
              <Alert variant="error" title="Error">{project.error || 'Unknown error.'}</Alert>
            ) : (
              project.job_id && (
                <Button href={`/progress/${project.job_id}`}>
                  Watch live progress <ArrowRight className="h-4 w-4" />
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="chapters">
          <TabsList>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="abstractions">Abstractions</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters">
            <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
              <ChapterNav titles={titles} active={chapter} onSelect={setChapter} />
              <div className="min-w-0">
                <Card className="p-6 md:p-10">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={chapter} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      {chapters[chapter] ? <Markdown content={chapters[chapter]} /> : <p className="text-muted-foreground">No content for this chapter.</p>}
                    </motion.div>
                  </AnimatePresence>
                  <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                    <Button variant="outline" disabled={chapter === 0} onClick={() => setChapter((c) => Math.max(0, c - 1))}>
                      <ArrowLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Chapter {chapter + 1} of {chapters.length}
                    </span>
                    <Button variant="outline" disabled={chapter >= chapters.length - 1} onClick={() => setChapter((c) => Math.min(chapters.length - 1, c + 1))}>
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Chapters" value={chapters.length} icon={ListOrdered} accent="indigo" />
                <StatCard label="Abstractions" value={abstractions.length} icon={Boxes} accent="emerald" />
                <StatCard label="Relationships" value={relationships?.details?.length ?? 0} icon={Network} accent="sky" />
                <StatCard label="Language" value={(project.config?.language ?? 'english').replace(/^./, (c) => c.toUpperCase())} icon={Languages} accent="amber" />
              </div>
              {relationships?.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Architecture summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Markdown content={relationships.summary} />
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</p>
                    <p className="mt-1 break-all font-mono text-xs">{project.source}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Generated</p>
                    <p className="mt-1">{relativeTime(project.completed_at ?? project.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="abstractions">
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                {abstractions.map((a, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-mono text-xs font-semibold text-accent-foreground">{i + 1}</span>
                      <h3 className="font-semibold">{a.name?.trim()}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.description?.trim()}</p>
                    {a.files?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.files.map((f) => (
                          <Badge key={f} variant="outline" className="font-mono font-normal">file #{f}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              {relationships?.details && relationships.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Relationships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {relationships.details.map((r, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                          <Badge variant="secondary" className="font-normal">{abstractions[r.from]?.name?.trim() ?? `#${r.from}`}</Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <Badge variant="secondary" className="font-normal">{abstractions[r.to]?.name?.trim() ?? `#${r.to}`}</Badge>
                          <span className="text-muted-foreground">{r.label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}
