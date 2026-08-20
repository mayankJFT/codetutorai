'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Monitor, Moon, Save, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { tutorialAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface AppSettings {
  default_language: string
  max_file_size: number
  cache_enabled: boolean
  max_abstractions: number
  auto_save: boolean
  notifications: boolean
  github_token: string
}

const DEFAULTS: AppSettings = {
  default_language: 'english',
  max_file_size: 100000,
  cache_enabled: true,
  max_abstractions: 10,
  auto_save: true,
  notifications: true,
  github_token: '',
}

const LANGUAGES = ['english', 'spanish', 'french', 'german', 'portuguese', 'chinese', 'japanese', 'hindi']

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AppSettings>(DEFAULTS)
  const [dirty, setDirty] = useState(false)
  const [tokenConfigured, setTokenConfigured] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => tutorialAPI.getSettings(),
  })

  useEffect(() => {
    if (!settings) return
    setForm({
      default_language: settings.default_language ?? 'english',
      max_file_size: settings.max_file_size ?? 100000,
      cache_enabled: settings.cache_enabled ?? true,
      max_abstractions: settings.max_abstractions ?? 10,
      auto_save: settings.auto_save ?? true,
      notifications: settings.notifications ?? true,
      github_token: '',
    })
    setTokenConfigured(!!settings.github_token_configured)
    setDirty(false)
  }, [settings])

  const save = useMutation({
    mutationFn: (data: AppSettings) => {
      const payload: Record<string, unknown> = { ...data }
      if (!data.github_token) delete payload.github_token
      return tutorialAPI.updateSettings(payload)
    },
    onSuccess: () => {
      toast.success('Settings saved')
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to save settings'),
  })

  const patch = (p: Partial<AppSettings>) => {
    setForm((f) => ({ ...f, ...p }))
    setDirty(true)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/3 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile, generation defaults and appearance." />

      <div className="space-y-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {user && <Avatar name={user.full_name} size="lg" />}
            <div>
              <p className="font-medium">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation defaults</CardTitle>
            <CardDescription>Applied to every new project unless overridden.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_language">Default language</Label>
              <Select id="default_language" value={form.default_language} onChange={(e) => patch({ default_language: e.target.value })}>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="max_abstractions">Max abstractions</Label>
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{form.max_abstractions}</span>
              </div>
              <input id="max_abstractions" type="range" min={3} max={15} value={form.max_abstractions} onChange={(e) => patch({ max_abstractions: Number(e.target.value) })} className="mt-3 w-full accent-indigo-600" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_file_size">Max file size (bytes)</Label>
              <Input id="max_file_size" type="number" min={1000} step={1000} value={form.max_file_size} onChange={(e) => patch({ max_file_size: Number(e.target.value) })} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="cache_enabled">LLM cache</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">Reuse identical prompts.</p>
                </div>
                <Switch id="cache_enabled" checked={form.cache_enabled} onCheckedChange={(v) => patch({ cache_enabled: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">Toast when a job finishes.</p>
                </div>
                <Switch id="notifications" checked={form.notifications} onCheckedChange={(v) => patch({ notifications: v })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme applies immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                    theme === opt.value ? 'border-primary bg-accent' : 'border-border hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <opt.icon className={cn('h-5 w-5', theme === opt.value ? 'text-primary dark:text-accent-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium', theme === opt.value && 'text-accent-foreground')}>{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Tokens are stored server-side and never displayed again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="github_token" className="flex items-center gap-2">
                <Github className="h-4 w-4" /> GitHub token
              </Label>
              {tokenConfigured ? <Badge variant="success">Configured</Badge> : <Badge variant="secondary">Not set</Badge>}
            </div>
            <Input id="github_token" type="password" placeholder={tokenConfigured ? '•••••••••••• (leave blank to keep)' : 'ghp_…'} value={form.github_token} onChange={(e) => patch({ github_token: e.target.value })} autoComplete="off" />
            <p className="text-xs text-muted-foreground">Used for private repositories and higher GitHub API rate limits.</p>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setForm({ ...DEFAULTS, ...settings, github_token: '' }); setDirty(false) }} disabled={save.isPending}>
                  Discard
                </Button>
                <Button size="sm" loading={save.isPending} onClick={() => save.mutate(form)}>
                  <Save className="h-3.5 w-3.5" /> Save changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
