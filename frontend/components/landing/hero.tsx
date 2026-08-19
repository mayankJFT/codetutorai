'use client'

import { ArrowRight, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn, Pulse } from '@/components/motion'
import { ProductMock } from './product-mock'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20" />
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <Badge variant="info" className="mb-6 gap-2 px-3 py-1">
              <Pulse color="bg-sky-500" /> Groq-accelerated generation · new
            </Badge>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Turn any codebase into a <span className="text-gradient">guided tutorial</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              CodeTutor AI reads a repository, maps its architecture, and writes a chapter-by-chapter learning path — complete with diagrams, code walkthroughs and a polished PDF.
            </p>
          </FadeIn>
          <FadeIn delay={0.15} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="gradient" size="lg" href="/auth/register">
              Generate your first tutorial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" href="#how">
              <PlayCircle className="h-4 w-4" /> See how it works
            </Button>
          </FadeIn>
        </div>
        <FadeIn delay={0.25} y={16} className="mx-auto mt-16 max-w-4xl">
          <ProductMock />
        </FadeIn>
      </div>
    </section>
  )
}
