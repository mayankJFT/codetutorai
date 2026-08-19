'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { useSidebar } from './app-shell'

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setMobileOpen } = useSidebar()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? 'CodeTutor AI'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <p className="hidden text-sm font-medium text-muted-foreground md:block">{current}</p>
      <form
        className="ml-auto w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(`/projects?q=${encodeURIComponent(q)}`)
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="h-9 pl-9 pr-12" />
          <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 md:block">
            <Kbd>/</Kbd>
          </span>
        </div>
      </form>
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
