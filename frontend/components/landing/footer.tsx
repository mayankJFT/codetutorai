import Link from 'next/link'
import { Github, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>© {new Date().getFullYear()} CodeTutor AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="hover:text-foreground">Sign in</Link>
          <Link href="/auth/register" className="hover:text-foreground">Create account</Link>
          <a href="https://github.com/mynkchaudhry/Repocourseai" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
