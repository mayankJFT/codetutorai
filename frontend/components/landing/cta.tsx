'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion'

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-8 py-16 text-center text-white shadow-lift md:px-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
            <h2 className="relative text-balance text-3xl font-semibold tracking-tight md:text-4xl">Ready to onboard engineers 10× faster?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/80">Generate your first tutorial in minutes. No credit card, no setup — just a repository.</p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" href="/auth/register" className="bg-white text-indigo-700 hover:bg-indigo-50">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" href="/auth/login" className="text-white hover:bg-white/10">
                Sign in
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
