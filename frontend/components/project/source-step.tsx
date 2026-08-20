'use client'

import { useState } from 'react'
import { ArrowRight, FolderOpen, Github, Search } from 'lucide-react'
import type { GitHubRepo, ProjectConfig } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RepositorySearchDialog } from '@/components/github/repository-search-dialog'

const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i

export function SourceStep({
  config,
  onChange,
  onNext,
}: {
  config: ProjectConfig
  onChange: (patch: Partial<ProjectConfig>) => void
  onNext: () => void
}) {
  const [tab, setTab] = useState<'github' | 'local'>(config.local_dir ? 'local' : 'github')
  const [touched, setTouched] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const repoValid = !!config.repo_url && GITHUB_RE.test(config.repo_url)
  const localValid = !!config.local_dir && config.local_dir.trim().length > 1
  const valid = tab === 'github' ? repoValid : localValid

  const handleSelect = (repo: GitHubRepo) => {
    onChange({ repo_url: repo.html_url, local_dir: undefined, project_name: config.project_name || repo.name })
    setTouched(true)
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'github' | 'local')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="github"><Github className="h-4 w-4" /> GitHub repository</TabsTrigger>
          <TabsTrigger value="local"><FolderOpen className="h-4 w-4" /> Local directory</TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="repo_url">Repository URL</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
                <Search className="h-3.5 w-3.5" /> Browse GitHub
              </Button>
            </div>
            <div className="relative">
              <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="repo_url"
                placeholder="https://github.com/owner/repository"
                className="pl-9"
                value={config.repo_url ?? ''}
                onChange={(e) => { onChange({ repo_url: e.target.value, local_dir: undefined }); setTouched(true) }}
                onBlur={() => setTouched(true)}
              />
            </div>
            {touched && config.repo_url && !repoValid ? (
              <p className="text-xs text-rose-600">Enter a full GitHub URL like https://github.com/owner/repo</p>
            ) : (
              <p className="text-xs text-muted-foreground">Public repositories work out of the box. Private ones need a token below.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_token">GitHub token <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="github_token" type="password" placeholder="ghp_••••••••••••" value={config.github_token ?? ''} onChange={(e) => onChange({ github_token: e.target.value })} autoComplete="off" />
            <p className="text-xs text-muted-foreground">Used only for this request — required for private repos and to avoid rate limits.</p>
          </div>
        </TabsContent>

        <TabsContent value="local" className="space-y-2">
          <Label htmlFor="local_dir">Absolute path on the server</Label>
          <div className="relative">
            <FolderOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="local_dir" placeholder="/home/me/projects/my-app" className="pl-9 font-mono text-sm" value={config.local_dir ?? ''} onChange={(e) => { onChange({ local_dir: e.target.value, repo_url: undefined }); setTouched(true) }} />
          </div>
          <p className="text-xs text-muted-foreground">The directory must be readable by the CodeTutor backend process.</p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="button" onClick={onNext} disabled={!valid}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <RepositorySearchDialog open={searchOpen} onOpenChange={setSearchOpen} onSelect={handleSelect} />
    </div>
  )
}
