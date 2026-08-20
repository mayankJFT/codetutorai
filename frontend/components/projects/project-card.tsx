'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, FileDown, Github, HardDrive, MoreVertical, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { tutorialAPI, type Project } from '@/lib/api'
import { relativeTime } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'

export function projectHref(p: Project) {
  return (p.status === 'processing' || p.status === 'pending') && p.job_id ? `/progress/${p.job_id}` : `/projects/${p.id}`
}

export async function downloadProjectPdf(p: Project) {
  const toastId = toast.loading('Preparing PDF…')
  try {
    const blob = await tutorialAPI.downloadProjectPDF(p.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${p.name}-tutorial.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('PDF downloaded', { id: toastId })
  } catch {
    toast.error('PDF export failed', { id: toastId })
  }
}

export function ProjectCard({ project, onDelete }: { project: Project; onDelete: (p: Project) => void }) {
  const router = useRouter()
  const Icon = project.type === 'github' ? Github : HardDrive
  const chapters = project.result?.chapters?.length

  return (
    <Card
      className="group flex cursor-pointer flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
      onClick={() => router.push(projectHref(project))}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{project.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{project.source}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Project actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => router.push(projectHref(project))}>
              <BookOpen className="h-4 w-4" /> Open
            </DropdownMenuItem>
            {project.status === 'completed' && (
              <DropdownMenuItem onSelect={() => downloadProjectPdf(project)}>
                <FileDown className="h-4 w-4" /> Download PDF
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onDelete(project)}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={project.status} />
        {typeof chapters === 'number' && chapters > 0 && (
          <span className="text-xs text-muted-foreground">{chapters} chapters</span>
        )}
      </div>
      {(project.status === 'processing' || project.status === 'pending') && (
        <Progress value={Number(project.progress) || 0} className="mt-3 h-1.5" />
      )}
      <p className="mt-auto pt-4 text-xs text-muted-foreground">Created {relativeTime(project.created_at)}</p>
    </Card>
  )
}
