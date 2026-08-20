import { Badge } from '@/components/ui/badge'
import { statusMeta } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status)
  return <Badge variant={meta.badge}>{meta.label}</Badge>
}
