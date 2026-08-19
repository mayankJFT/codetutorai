'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

export function FadeIn({
  children,
  delay = 0,
  y = 8,
  className,
  ...rest
}: { children: React.ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
