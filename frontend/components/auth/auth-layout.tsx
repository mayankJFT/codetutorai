import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { FadeIn } from '@/components/motion'
import { BrandPanel } from './brand-panel'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">CodeTutor AI</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <FadeIn className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </FadeIn>
        </div>
        <p className="text-center text-xs text-muted-foreground">By continuing you agree to our Terms of Service and Privacy Policy.</p>
      </div>
      <BrandPanel />
    </div>
  )
}
