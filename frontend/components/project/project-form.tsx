'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { tutorialAPI, type ProjectConfig } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StepIndicator } from './step-indicator'
import { SourceStep } from './source-step'
import { ConfigureStep } from './configure-step'

const DEFAULTS: ProjectConfig = {
  repo_url: '',
  local_dir: undefined,
  project_name: '',
  github_token: '',
  include_patterns: ['*.py', '*.js', '*.ts', '*.tsx', '*.go', '*.java', '*.rs'],
  exclude_patterns: ['tests/*', 'test/*', 'docs/*', 'node_modules/*', 'dist/*', 'build/*', '*.test.*', '*.min.*'],
  max_file_size: 100000,
  language: 'english',
  use_cache: true,
  max_abstractions: 8,
}

export function ProjectForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<0 | 1>(0)
  const [config, setConfig] = useState<ProjectConfig>(DEFAULTS)
  const patch = (p: Partial<ProjectConfig>) => setConfig((c) => ({ ...c, ...p }))

  const create = useMutation({
    mutationFn: (data: ProjectConfig) => tutorialAPI.createProject(data),
    onSuccess: (data) => {
      toast.success('Tutorial generation started')
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      router.push(`/progress/${data.job_id}`)
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to start generation'),
  })

  const submit = () => {
    const final: ProjectConfig = {
      ...config,
      repo_url: config.repo_url || undefined,
      local_dir: config.local_dir || undefined,
      project_name: config.project_name || undefined,
      github_token: config.github_token || undefined,
    }
    create.mutate(final)
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <StepIndicator steps={['Source', 'Configure']} current={step} />
      </CardHeader>
      <CardContent className="pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: step === 0 ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: step === 0 ? 12 : -12 }} transition={{ duration: 0.2 }}>
            {step === 0 ? (
              <SourceStep config={config} onChange={patch} onNext={() => setStep(1)} />
            ) : (
              <ConfigureStep config={config} onChange={patch} onBack={() => setStep(0)} onSubmit={submit} submitting={create.isPending} />
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
