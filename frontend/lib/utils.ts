import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
export function relativeTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (diff < 60) return 'just now'
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour')
  if (diff < 86400 * 30) return rtf.format(-Math.floor(diff / 86400), 'day')
  return formatDate(d)
}

export type JobState = 'pending' | 'processing' | 'completed' | 'failed'

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'secondary'

export function statusMeta(status: string): { label: string; badge: StatusBadgeVariant; dot: string } {
  switch (status) {
    case 'completed':
      return { label: 'Completed', badge: 'success', dot: 'bg-emerald-500' }
    case 'processing':
      return { label: 'Processing', badge: 'warning', dot: 'bg-amber-500' }
    case 'failed':
      return { label: 'Failed', badge: 'danger', dot: 'bg-rose-500' }
    default:
      return { label: 'Pending', badge: 'secondary', dot: 'bg-slate-400' }
  }
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}
