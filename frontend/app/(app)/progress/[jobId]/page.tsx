'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Copy, FileDown, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getStreamUrl, tutorialAPI, type JobStatus } from '@/lib/api'
import { formatDuration, relativeTime, statusMeta } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { PipelineViz } from '@/components/progress/pipeline-viz'
import { LogStream } from '@/components/progress/log-stream'
import { FadeIn } from '@/components/motion'

export default function ProgressPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const queryClient = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const { data: job, isLoading, isError, refetch } = useQuery<JobStatus>({
    queryKey: ['job', jobId],
    queryFn: () => tutorialAPI.getJobStatus(jobId),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s === 'completed' || s === 'failed' ? false : 4000
    },
  })

  const running = job?.status === 'processing' || job?.status === 'pending'

  // SSE for low-latency updates; polling above is the fallback.
  useEffect(() => {
    if (!running || esRef.current) return
    const es = new EventSource(getStreamUrl(jobId))
    esRef.current = es
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        queryClient.setQueryData(['job', jobId], (prev: JobStatus | undefined) => ({ ...prev, ...data }))
        if (data.status === 'completed' || data.status === 'failed') es.close()
      } catch {
        /* ignore malformed frames */
      }
    }
    es.onerror = () => {
      es.close()
      esRef.current = null
    }
    return () => {
      es.close()
      esRef.current = null
    }
  }, [running, jobId, queryClient])

  // elapsed ticker
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  // find related project for "Open tutorial"
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: tutorialAPI.getProjects,
    enabled: job?.status === 'completed',
  })
  const project = useMemo(() => projects.find((p) => p.job_id === jobId), [projects, jobId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/2 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <Alert variant="error" title="Job not found" action={<Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCcw className="h-3.5 w-3.5" /> Retry</Button>}>
        This job doesn't exist or you don't have access to it.
      </Alert>
    )
  }

  const meta = statusMeta(job.status)
  const firstLog = job.logs?.[0]?.timestamp
  const lastLog = job.logs?.[job.logs.length - 1]?.timestamp
  const elapsed = firstLog ? (running ? now - new Date(firstLog).getTime() : lastLog ? new Date(lastLog).getTime() - new Date(firstLog).getTime() : 0) : 0

  const downloadPdf = async () => {
    if (!project) return
    const toastId = toast.loading('Preparing PDF…')
    try {
      const blob = await tutorialAPI.downloadProjectPDF(project.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}-tutorial.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded', { id: toastId })
    } catch {
      toast.error('PDF export failed', { id: toastId })
    }
  }

  return (
    <>
      <PageHeader
        title={job.name || 'Generating tutorial'}
        description={job.source || undefined}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Progress' }]}
        actions={<Badge variant={meta.badge} className="px-3 py-1 text-sm">{meta.label}</Badge>}
      />

      <div className="space-y-6">
        {job.status === 'completed' && (
          <FadeIn>
            <Alert
              variant="success"
              title="Tutorial ready"
              action={
                <div className="flex shrink-0 gap-2">
                  {project && (
                    <Button size="sm" href={`/projects/${project.id}`}>
                      <BookOpen className="h-3.5 w-3.5" /> Open tutorial
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={downloadPdf} disabled={!project}>
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              }
            >
              {job.result?.chapters?.length ?? '—'} chapters generated in {formatDuration(elapsed)}.
            </Alert>
          </FadeIn>
        )}

        {job.status === 'failed' && (
          <FadeIn>
            <Alert
              variant="error"
              title="Generation failed"
              action={<Button size="sm" variant="outline" href="/new-project">Try again</Button>}
            >
              <span className="break-all">{job.error || 'Unknown error — check the log below.'}</span>
            </Alert>
          </FadeIn>
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-8">
            <CardTitle>Pipeline</CardTitle>
            <span className="text-xs text-muted-foreground">{running ? `Elapsed ${formatDuration(elapsed)}` : firstLog ? `Took ${formatDuration(elapsed)}` : ''}</span>
          </CardHeader>
          <CardContent>
            <PipelineViz currentStep={job.current_step} progress={Number(job.progress) || 0} status={job.status} />
            <div className="mt-8 flex items-center gap-4">
              <Progress value={job.status === 'completed' ? 100 : Number(job.progress) || 0} className="h-2 flex-1" />
              <span className="w-10 text-right text-sm font-semibold">{job.status === 'completed' ? 100 : Math.round(Number(job.progress) || 0)}%</span>
            </div>
            {running && job.current_step && <p className="mt-2 text-sm text-muted-foreground">{job.current_step}…</p>}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <LogStream logs={job.logs ?? []} live={running} className="lg:col-span-2" />
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job ID</p>
                <button
                  className="mt-1 flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary"
                  onClick={() => { navigator.clipboard.writeText(jobId); toast.success('Copied job id') }}
                >
                  {jobId.slice(0, 18)}… <Copy className="h-3 w-3" />
                </button>
              </div>
              {job.source && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</p>
                  <p className="mt-1 break-all text-xs">{job.source}</p>
                </div>
              )}
              {job.created_at && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Started</p>
                  <p className="mt-1 text-xs">{relativeTime(job.created_at)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</p>
                <p className="mt-1 text-xs">{job.type === 'local' ? 'Local directory' : 'GitHub repository'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
