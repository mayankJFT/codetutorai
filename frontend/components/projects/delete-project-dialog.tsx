'use client'

import type { Project } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DeleteProjectDialog({
  project,
  onOpenChange,
  onConfirm,
  deleting,
}: {
  project: Project | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => void
  deleting: boolean
}) {
  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{project?.name}”?</DialogTitle>
          <DialogDescription>
            This permanently removes the project and its generated tutorial. This action can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deleting} onClick={() => project && onConfirm(project.id)}>
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
