'use client'

import { BookOpen, Brain, Github } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'

const steps = [
  { n: '01', icon: Github, title: 'Connect a repository', desc: 'Paste a GitHub URL or point at a local folder. Include/exclude patterns let you focus on what matters.' },
  { n: '02', icon: Brain, title: 'AI maps the architecture', desc: 'Core abstractions, their relationships and the best learning order are identified automatically.' },
  { n: '03', icon: BookOpen, title: 'Read, quiz, export', desc: 'Beginner-friendly chapters with diagrams and code, plus quizzes, a playground and one-click PDF export.' },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border bg-card/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Three steps from repo to onboarding-ready docs</h2>
        </FadeIn>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={0.1 + i * 0.08}>
              <Card className="h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
