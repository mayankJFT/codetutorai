'use client'

import { ChevronDown, FileCode2, FileDown, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { tutorialAPI, type Project } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportMenu({ project }: { project: Project }) {
  const doExport = async (format: 'pdf' | 'markdown' | 'html') => {
    const toastId = toast.loading(`Exporting ${format.toUpperCase()}…`)
    try {
      const blob = format === 'pdf' ? await tutorialAPI.downloadProjectPDF(project.id) : await tutorialAPI.exportTutorial(project.id, format)
      await save(blob, `${project.name}-tutorial.${format === 'markdown' ? 'md' : format}`)
      toast.success(`${format.toUpperCase()} exported`, { id: toastId })
    } catch {
      toast.error(`${format.toUpperCase()} export failed`, { id: toastId })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="gradient">
          <FileDown className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => doExport('pdf')}>
          <FileDown className="h-4 w-4" /> PDF document
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => doExport('markdown')}>
          <FileText className="h-4 w-4" /> Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => doExport('html')}>
          <FileCode2 className="h-4 w-4" /> HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
