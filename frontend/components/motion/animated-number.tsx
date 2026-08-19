'use client'

import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

const defaultFormat = (n: number) => Math.round(n).toLocaleString()

export function AnimatedNumber({
  value,
  duration = 1,
  format = defaultFormat,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!ref.current || !inView) return
    if (reduce) {
      ref.current.textContent = format(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    // rAF is paused in background tabs; make sure the final value always lands.
    const settle = window.setTimeout(() => {
      if (ref.current) ref.current.textContent = format(value)
    }, duration * 1000 + 150)
    return () => {
      controls.stop()
      window.clearTimeout(settle)
    }
  }, [value, inView, reduce, duration, format])

  return <span ref={ref}>{reduce ? format(value) : format(0)}</span>
}
