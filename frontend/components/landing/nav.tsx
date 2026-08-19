'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">CodeTutor AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#export" className="transition-colors hover:text-foreground">Export</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" href="/auth/login">Sign in</Button>
          <Button variant="gradient" href="/auth/register">Get started</Button>
        </div>
      </div>
    </header>
  )
}
