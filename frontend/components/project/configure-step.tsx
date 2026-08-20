'use client'

import { ArrowLeft, Sparkles } from 'lucide-react'
import type { ProjectConfig } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChipInput } from './chip-input'

const LANGUAGES = ['english', 'spanish', 'french', 'german', 'portuguese', 'chinese', 'japanese', 'hindi']

export function ConfigureStep({
  config,
  onChange,
  onBack,
  onSubmit,
  submitting,
}: {
  config: ProjectConfig
  onChange: (patch: Partial<ProjectConfig>) => void
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="project_name">Project name <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="project_name" placeholder="My awesome project" value={config.project_name ?? ''} onChange={(e) => onChange({ project_name: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Tutorial language</Label>
          <Select id="language" value={config.language ?? 'english'} onChange={(e) => onChange({ language: e.target.value })}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="max_abstractions">Max abstractions</Label>
            <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{config.max_abstractions ?? 10}</span>
          </div>
          <input
            id="max_abstractions"
            type="range"
            min={3}
            max={15}
            step={1}
            value={config.max_abstractions ?? 10}
            onChange={(e) => onChange({ max_abstractions: Number(e.target.value) })}
            className="mt-3 w-full accent-indigo-600"
          />
          <p className="text-xs text-muted-foreground">Fewer abstractions → shorter, faster tutorials. 3–5 is ideal for small repos.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_file_size">Max file size</Label>
          <div className="relative">
            <Input id="max_file_size" type="number" min={1000} step={1000} value={config.max_file_size ?? 100000} onChange={(e) => onChange({ max_file_size: Number(e.target.value) })} className="pr-14" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">bytes</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="use_cache">Use LLM cache</Label>
            <p className="mt-1 text-xs text-muted-foreground">Reuse previous answers for identical prompts.</p>
          </div>
          <Switch id="use_cache" checked={config.use_cache ?? true} onCheckedChange={(v) => onChange({ use_cache: v })} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="include">Include patterns</Label>
          <ChipInput id="include" value={config.include_patterns ?? []} onChange={(v) => onChange({ include_patterns: v })} placeholder="*.py, *.ts … press Enter" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="exclude">Exclude patterns</Label>
          <ChipInput id="exclude" value={config.exclude_patterns ?? []} onChange={(v) => onChange({ exclude_patterns: v })} placeholder="tests/*, docs/* … press Enter" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="submit" variant="gradient" loading={submitting}>
          {!submitting && <Sparkles className="h-4 w-4" />} Generate tutorial
        </Button>
      </div>
    </form>
  )
}
