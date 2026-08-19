'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, PanelLeftClose, PanelLeftOpen, Plus, Sparkles } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/components/auth-provider'
import { useSidebar } from './app-shell'

export function Logo({ collapsed = false, href = '/dashboard' }: { collapsed?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-soft">
        <Sparkles className="h-4 w-4" />
      </span>
      {!collapsed && <span className="text-[15px] font-semibold tracking-tight">CodeTutor AI</span>}
    </Link>
  )
}

export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const link = (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'text-foreground hover:bg-transparent',
              collapsed && 'justify-center px-0'
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn('relative z-10 h-4 w-4', active && 'text-primary dark:text-accent-foreground')} />
            {!collapsed && <span className={cn('relative z-10', active && 'text-accent-foreground')}>{label}</span>}
          </Link>
        )
        return collapsed ? (
          <Tooltip key={href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const router = useRouter()
  const { collapsed, toggle } = useSidebar()
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
        <Logo collapsed={collapsed} />
      </div>

      <div className={cn('px-3 pb-2', collapsed && 'px-2')}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="gradient" size="icon" className="w-full" onClick={() => router.push('/new-project')} aria-label="New project">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New project</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="gradient" className="w-full" onClick={() => router.push('/new-project')}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      <NavLinks collapsed={collapsed} />

      <div className="border-t border-border p-3">
        {user && (
          <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
            <Avatar name={user.full_name} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={logout} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-1 w-full justify-center text-muted-foreground" onClick={toggle} aria-label="Toggle sidebar">
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" /> Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
