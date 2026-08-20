'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pulse } from '@/components/motion'

const LEVEL_CLS: Record<string, string> = {
  INFO: 'text-slate-400',
  WARN: 'text-amber-400',
  ERROR: 'text-rose-400',
}

export function LogStream({ logs, live, className }: { logs: LogEntry[]; live: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (el && atBottom) el.scrollTop = el.scrollHeight
  }, [logs.length, atBottom])

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Live log</CardTitle>
        {live && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pulse /> streaming
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div
          ref={ref}
          onScroll={(e) => {
            const el = e.currentTarget
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
          }}
          className="scrollbar-thin h-80 overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200"
        >
          {logs.length === 0 ? (
            <p className="text-slate-500">Waiting for logs…</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 text-slate-600">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className={cn('w-12 shrink-0 font-semibold', LEVEL_CLS[log.level] ?? 'text-slate-400')}>{log.level}</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
