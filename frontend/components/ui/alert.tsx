import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const styles = {
  info: ['border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100', Info],
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100', CheckCircle2],
  warning: ['border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100', AlertTriangle],
  error: ['border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100', AlertCircle],
} as const

export function Alert({
  variant = 'info',
  title,
  children,
  action,
  className,
}: {
  variant?: keyof typeof styles
  title?: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  const [cls, Icon] = styles[variant]
  return (
    <div role="alert" className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  )
}
