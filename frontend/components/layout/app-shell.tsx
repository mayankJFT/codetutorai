'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { PageTransition } from '@/components/motion'

interface SidebarCtx {
  collapsed: boolean
  toggle: () => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const Ctx = createContext<SidebarCtx | null>(null)

export function useSidebar() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSidebar must be used inside AppShell')
  return c
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar:collapsed') === '1')
  }, [])

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem('sidebar:collapsed', c ? '0' : '1')
      return !c
    })

  return (
    <Ctx.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1">
            <div className="w-full px-4 py-6 md:px-8 md:py-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
