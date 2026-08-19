'use client'

import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tutorialAPI, type Project } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function weekly(projects: Project[]) {
  const now = new Date()
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (6 - i))
    const day = projects.filter((p) => new Date(p.created_at).toDateString() === d.toDateString())
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: day.filter((p) => p.status === 'completed').length,
      failed: day.filter((p) => p.status === 'failed').length,
      processing: day.filter((p) => p.status === 'processing' || p.status === 'pending').length,
    }
  })
}

export function ActivityChart() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: tutorialAPI.getProjects, refetchInterval: 30000 })
  const data = weekly(projects)
  const total = projects.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly activity</CardTitle>
        <CardDescription>Tutorials generated over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <div className="relative h-64">
            {total === 0 && (
              <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">Activity will appear here once you generate a tutorial.</p>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProcessing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--border))' }}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#4F46E5" strokeWidth={2} fill="url(#gCompleted)" />
                <Area type="monotone" dataKey="processing" name="Processing" stroke="#F59E0B" strokeWidth={2} fill="url(#gProcessing)" />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="#F43F5E" strokeWidth={2} fill="url(#gFailed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-600" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Processing</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Failed</span>
        </div>
      </CardContent>
    </Card>
  )
}
