'use client'

import { Activity, Code2, FileDown, Gamepad2, ListOrdered, Network } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'

const features = [
  { icon: Code2, title: 'Language detection', desc: 'Python, TypeScript, Go, Rust, Java and 15+ more — handled out of the box.' },
  { icon: Network, title: 'Architecture recognition', desc: 'MVC, microservices, pipelines and REST APIs identified and explained.' },
  { icon: ListOrdered, title: 'Chapter-based learning', desc: 'Concepts ordered from foundations to advanced, with cross-links between chapters.' },
  { icon: Activity, title: 'Live progress streaming', desc: 'Watch every pipeline stage and log line in real time while a tutorial is generated.' },
  { icon: FileDown, title: 'Professional export', desc: 'Syntax-highlighted PDF, Markdown or HTML — ready to share with a new hire.' },
  { icon: Gamepad2, title: 'Quizzes & playground', desc: 'Interactive questions and a code sandbox turn reading into doing.' },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Everything a new engineer needs on day one</h2>
          <p className="mt-4 text-muted-foreground">Built for teams that onboard often and document rarely.</p>
        </FadeIn>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={0.05 + i * 0.05}>
              <Card className="group h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-soft transition-transform group-hover:scale-105">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
