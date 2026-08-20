'use client'

import { PageHeader } from '@/components/ui/page-header'
import { ProjectForm } from '@/components/project/project-form'

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        title="New project"
        description="Point CodeTutor AI at a codebase and we'll write the tutorial."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'New project' }]}
      />
      <div className="w-full">
        <ProjectForm />
      </div>
    </>
  )
}
