# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `frontend/` Next.js UI as a consistent, light "clean SaaS" product with a shared app shell, an in-repo component kit, framer-motion throughout, and a public landing page — without changing the backend API.

**Architecture:** Design-system-first. `components/ui/*` (kit) + `components/motion/*` (motion primitives) + `components/layout/app-shell.tsx` (one shell) are built first; every page is then rebuilt on top of them under an `app/(app)/` route group. `lib/api.ts` and react-query data access stay as-is. Public landing lives at `app/page.tsx`; dashboard moves to `/dashboard`.

**Tech Stack:** Next.js 15 (app router), React 19, TypeScript, Tailwind 3.4, framer-motion 12, lucide-react, Radix (dialog, dropdown-menu, tabs, tooltip, switch — already installed), @tanstack/react-query, react-hot-toast, recharts, js-cookie. New deps: `react-markdown`, `remark-gfm`, `rehype-highlight`, `@tailwindcss/typography`, `class-variance-authority`.

**Spec:** `docs/superpowers/specs/2026-08-19-ui-redesign-design.md`

## Global Constraints

- Frontend only; backend (`backend.py`) and `lib/api.ts` method signatures unchanged (new helpers may be *added* to `lib/api.ts`).
- Light theme is the designed default; `.dark` CSS variables must stay legible. Theme toggle must keep working.
- Font: Inter via `next/font/google`; Barlow Condensed removed (dependency + all `font-barlow` classes).
- Palette: canvas `#FAFAFA`, surfaces white + `border-slate-200`, text `slate-900/600/500`, primary indigo `#4F46E5` (hover `#4338CA`), CTA gradient `from-indigo-600 to-violet-600`, status emerald/amber/rose/sky.
- Radius: cards `rounded-xl`, inputs/buttons `rounded-lg`.
- All motion respects `prefers-reduced-motion` (`useReducedMotion()` from framer-motion).
- Every data view: loading skeleton, empty state with CTA, inline error with retry.
- Branding string: **CodeTutor AI**.
- Work on branch `ui-redesign`. Commit at the end of every task.
- Verification per task: `cd frontend && npx tsc --noEmit` must pass; page tasks also get a Chrome screenshot check (light + dark where relevant). `npm run build` at Tasks 4, 9, 13.
- Testing note: the frontend has no unit-test harness; TDD for visual components is replaced by type-check + rendered verification in the browser. Pure helpers (e.g. `lib/format.ts`) get small test files run with `node --test` via `tsx` only if added — none are planned.

---

## File structure

```
frontend/
  app/
    layout.tsx                      # Inter font, Providers
    page.tsx                        # PUBLIC landing (new)
    globals.css                     # tokens (rewritten)
    auth/login/page.tsx             # rebuilt
    auth/register/page.tsx          # rebuilt
    (app)/
      layout.tsx                    # AppShell wrapper (new)
      dashboard/page.tsx            # moved from app/page.tsx
      new-project/page.tsx
      projects/page.tsx
      projects/[id]/page.tsx
      tutorials/page.tsx
      progress/[jobId]/page.tsx
      history/page.tsx
      settings/page.tsx
      interactive-tutorial/page.tsx
  components/
    ui/         button card input textarea select badge skeleton separator kbd
                progress empty-state page-header stat-card avatar switch tabs
                dialog tooltip dropdown-menu alert
    motion/     fade-in stagger animated-number page-transition pulse
    layout/     app-shell sidebar topbar theme-toggle user-menu mobile-nav
    landing/    nav hero how-it-works features stats cta footer product-mock
    dashboard/  stats-cards recent-projects active-jobs activity-chart (rebuilt)
    project/    project-form (rebuilt) source-step configure-step chip-input
    github/     repository-search-dialog (rebuilt)
    progress/   pipeline-viz log-stream
    tutorial/   markdown chapter-nav reader
    projects/   project-card project-grid status-badge
  lib/
    api.ts (unchanged + `getStreamUrl`)
    utils.ts (+ relativeTime, statusMeta)
    nav.ts (nav items)
```

---

### Task 0: Branch, dependencies, design tokens, font

**Files:**
- Modify: `frontend/package.json`, `frontend/tailwind.config.js`, `frontend/app/globals.css`, `frontend/app/layout.tsx`
- Create: `frontend/lib/nav.ts`

**Interfaces:**
- Produces: Tailwind color tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`), `font-sans` = Inter, `.prose` via typography plugin, `NAV_ITEMS`.

- [ ] **Step 1: Branch**

```bash
cd /home/jellyfish/Repocourseai && git checkout -b ui-redesign
```

- [ ] **Step 2: Install deps / remove Barlow**

```bash
cd frontend && npm i react-markdown remark-gfm rehype-highlight class-variance-authority @tailwindcss/typography && npm uninstall @fontsource/barlow-condensed
```

- [ ] **Step 3: Rewrite `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%;          /* #FAFAFA */
    --foreground: 222 47% 11%;       /* slate-900 */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%; /* slate-500 */
    --primary: 243 75% 59%;          /* #4F46E5 */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --accent: 226 100% 97%;          /* indigo-50 */
    --accent-foreground: 243 75% 40%;
    --destructive: 350 89% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;           /* slate-200 */
    --input: 214 32% 91%;
    --ring: 243 75% 59%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;
    --card: 222 44% 9%;
    --card-foreground: 210 40% 98%;
    --muted: 217 33% 14%;
    --muted-foreground: 215 20% 65%;
    --primary: 239 84% 67%;          /* indigo-400 */
    --primary-foreground: 222 47% 6%;
    --secondary: 217 33% 14%;
    --secondary-foreground: 210 40% 98%;
    --accent: 243 40% 16%;
    --accent-foreground: 239 84% 80%;
    --destructive: 350 89% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 239 84% 67%;
  }
  * { @apply border-border; }
  html { @apply antialiased; }
  body { @apply bg-background text-foreground; font-feature-settings: "cv11", "ss01"; }
  ::selection { @apply bg-indigo-200 text-slate-900; }
}

@layer utilities {
  .text-gradient { @apply bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent; }
  .bg-gradient-primary { @apply bg-gradient-to-r from-indigo-600 to-violet-600; }
  .bg-grid { background-image: linear-gradient(to right, rgb(15 23 42 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.04) 1px, transparent 1px); background-size: 32px 32px; }
  .dark .bg-grid { background-image: linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px); }
  .scrollbar-thin { scrollbar-width: thin; }
}

/* highlight.js theme (github light / dark) */
.hljs { @apply block overflow-x-auto; }
.prose pre { @apply bg-slate-950 text-slate-100 rounded-lg; }
.prose code:not(pre code) { @apply rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-normal text-indigo-700 dark:text-indigo-300 before:content-none after:content-none; }
```

- [ ] **Step 4: Rewrite `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1280px' } },
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: { xl: 'var(--radius)', lg: 'calc(var(--radius) - 4px)', md: 'calc(var(--radius) - 6px)' },
      boxShadow: {
        soft: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)',
        lift: '0 4px 12px rgb(15 23 42 / 0.08), 0 1px 3px rgb(15 23 42 / 0.06)',
        glow: '0 0 0 1px rgb(79 70 229 / 0.15), 0 8px 30px rgb(79 70 229 / 0.18)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-ring': { '0%': { transform: 'scale(1)', opacity: '0.6' }, '100%': { transform: 'scale(1.8)', opacity: '0' } },
      },
      animation: { shimmer: 'shimmer 1.6s linear infinite', 'pulse-ring': 'pulse-ring 1.4s ease-out infinite' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

- [ ] **Step 5: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'CodeTutor AI', template: '%s · CodeTutor AI' },
  description: 'Turn any codebase into a beginner-friendly, chapter-based tutorial in minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create `lib/nav.ts`**

```ts
import { LayoutDashboard, FolderOpen, BookOpen, History, Settings, type LucideIcon } from 'lucide-react'
export interface NavItem { label: string; href: string; icon: LucideIcon }
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'Tutorials', href: '/tutorials', icon: BookOpen },
  { label: 'History', href: '/history', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
]
```

- [ ] **Step 7: Remove `font-barlow` usages so type-check/build won't reference the font**

```bash
cd frontend && grep -rl "font-barlow" app components | xargs sed -i 's/ font-barlow//g; s/font-barlow //g; s/font-barlow//g'
```
Also update `components/providers.tsx` Toaster: `className: 'font-sans text-sm'`, style `{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)' }`.

- [ ] **Step 8: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build 2>&1 | tail -5` — expected: no TS errors, build succeeds (pages still old-looking but compile).

- [ ] **Step 9: Commit**

```bash
git add -A frontend docs && git commit -m "ui: design tokens, Inter font, deps for redesign"
```

---

### Task 1: UI kit — primitives

**Files:**
- Create: `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx`, `badge.tsx`, `skeleton.tsx`, `separator.tsx`, `kbd.tsx`, `alert.tsx`
- Modify: `lib/utils.ts` (add `relativeTime`, `statusMeta`)

**Interfaces (produces):**
- `Button` props: `variant?: 'primary'|'secondary'|'outline'|'ghost'|'destructive'|'gradient'`, `size?: 'sm'|'md'|'lg'|'icon'`, `loading?: boolean`, `asChild?: boolean` (no — keep simple: accept `href?` → renders `next/link`), plus native button props.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (div wrappers with `className`).
- `Input`, `Textarea`, `Select` (native), `Label` — forwardRef, styled.
- `Badge` props: `variant?: 'default'|'secondary'|'success'|'warning'|'danger'|'info'|'outline'`.
- `Skeleton` (`className`), `Separator`, `Kbd`, `Alert` (`variant: 'info'|'error'|'success'|'warning'`, `title?`, children).
- `statusMeta(status)` → `{ label, badge: BadgeVariant, dot: string(tailwind bg class) }`; `relativeTime(iso)` → "3 min ago".

- [ ] **Step 1: `components/ui/button.tsx`**

```tsx
'use client'
import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-soft hover:bg-indigo-700',
        gradient: 'bg-gradient-primary text-white shadow-soft hover:shadow-glow',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-800',
        outline: 'border border-border bg-card text-foreground shadow-soft hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-rose-600',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4', lg: 'h-12 px-6 text-base', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  href?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, href, children, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className)
    if (href) return <Link href={href} className={classes}>{children}</Link>
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export { buttonVariants }
```

- [ ] **Step 2: `components/ui/card.tsx`**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
const make = (base: string, tag: 'div' | 'h3' | 'p' = 'div') =>
  React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ className, ...p }, ref) =>
    React.createElement(tag, { ref, className: cn(base, className), ...p }))
export const Card = make('rounded-xl border border-border bg-card text-card-foreground shadow-soft')
export const CardHeader = make('flex flex-col space-y-1.5 p-6')
export const CardTitle = make('text-base font-semibold leading-none tracking-tight', 'h3')
export const CardDescription = make('text-sm text-muted-foreground', 'p')
export const CardContent = make('p-6 pt-0')
export const CardFooter = make('flex items-center p-6 pt-0')
;[Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter].forEach((c, i) => { c.displayName = ['Card','CardHeader','CardTitle','CardDescription','CardContent','CardFooter'][i] })
```

- [ ] **Step 3: `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx`**

```tsx
// input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
export const inputClasses = 'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-soft transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClasses, className)} {...props} />
))
Input.displayName = 'Input'

// textarea.tsx
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClasses, 'min-h-[96px] resize-y', className)} {...props} />
))
Textarea.displayName = 'Textarea'

// select.tsx (native)
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(inputClasses, 'appearance-none pr-9', className)} {...props}>{children}</select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
))
Select.displayName = 'Select'

// label.tsx
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium leading-none text-foreground', className)} {...props} />
))
Label.displayName = 'Label'
```
(Each in its own file with its own imports; `ChevronDown` from lucide-react; `inputClasses` exported from `input.tsx` and imported by the others.)

- [ ] **Step 4: `badge.tsx`, `skeleton.tsx`, `separator.tsx`, `kbd.tsx`, `alert.tsx`**

```tsx
// badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
export const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', {
  variants: { variant: {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'border-border text-foreground',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
    info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  } },
  defaultVariants: { variant: 'default' },
})
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>
export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

// skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-muted bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.6)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer dark:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.08)_50%,transparent_70%)]', className)} />
}

// separator.tsx
export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return <div role="separator" className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} />
}

// kbd.tsx
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">{children}</kbd>
}

// alert.tsx
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
const styles = {
  info: ['border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100', Info],
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100', CheckCircle2],
  warning: ['border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100', AlertTriangle],
  error: ['border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100', AlertCircle],
} as const
export function Alert({ variant = 'info', title, children, action, className }: { variant?: keyof typeof styles; title?: string; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  const [cls, Icon] = styles[variant]
  return (
    <div role="alert" className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 space-y-1">{title && <p className="font-semibold">{title}</p>}{children && <div className="opacity-90">{children}</div>}</div>
      {action}
    </div>
  )
}
```

- [ ] **Step 5: extend `lib/utils.ts`**

```ts
import type { BadgeVariant } from '@/components/ui/badge'
export function relativeTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = (Date.now() - d.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (diff < 60) return 'just now'
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour')
  if (diff < 86400 * 30) return rtf.format(-Math.floor(diff / 86400), 'day')
  return formatDate(d)
}
export type JobState = 'pending' | 'processing' | 'completed' | 'failed'
export function statusMeta(status: string): { label: string; badge: BadgeVariant; dot: string } {
  switch (status) {
    case 'completed': return { label: 'Completed', badge: 'success', dot: 'bg-emerald-500' }
    case 'processing': return { label: 'Processing', badge: 'warning', dot: 'bg-amber-500' }
    case 'failed': return { label: 'Failed', badge: 'danger', dot: 'bg-rose-500' }
    default: return { label: 'Pending', badge: 'secondary', dot: 'bg-slate-400' }
  }
}
```

- [ ] **Step 6: Verify** — `npx tsc --noEmit` passes.
- [ ] **Step 7: Commit** — `git add -A frontend && git commit -m "ui: add component kit primitives"`

---

### Task 2: UI kit — composites & Radix wrappers

**Files:**
- Create: `components/ui/progress.tsx`, `empty-state.tsx`, `page-header.tsx`, `stat-card.tsx`, `avatar.tsx`, `switch.tsx`, `tabs.tsx`, `dialog.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`

**Interfaces (produces):**
- `Progress({ value: number; className?; indicatorClassName?; animated?: boolean })` — animated width via framer `motion.div`.
- `EmptyState({ icon: LucideIcon; title; description?; action?: ReactNode })`.
- `PageHeader({ title; description?; actions?: ReactNode; breadcrumbs?: {label, href?}[] })`.
- `StatCard({ label; value: number|string; suffix?; delta?: string; trend?: 'up'|'down'|'neutral'; icon: LucideIcon; accent?: 'indigo'|'emerald'|'amber'|'rose'|'sky' })` — numeric values animate with `AnimatedNumber` (Task 3; import lazily — StatCard is created in Task 2 but wired with AnimatedNumber in Task 3 Step 5).
- `Avatar({ name; email?; size?: 'sm'|'md'|'lg' })` — initials + deterministic gradient.
- `Switch` (Radix `@radix-ui/react-switch`), `Tabs, TabsList, TabsTrigger, TabsContent` (Radix tabs with animated underline via `layoutId`), `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose` (Radix dialog with framer fade/scale), `Tooltip, TooltipProvider, TooltipTrigger, TooltipContent`, `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel`.

- [ ] **Step 1: `progress.tsx`**

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  const reduce = useReducedMotion()
  const v = Math.max(0, Math.min(100, value || 0))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className={cn('h-full rounded-full bg-gradient-primary', indicatorClassName)} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20 }} />
    </div>
  )
}
```

- [ ] **Step 2: `empty-state.tsx`, `page-header.tsx`, `avatar.tsx`**

```tsx
// empty-state.tsx
export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Icon className="h-7 w-7" /></div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// page-header.tsx
export function PageHeader({ title, description, actions, breadcrumbs }: { title: string; description?: string; actions?: React.ReactNode; breadcrumbs?: { label: string; href?: string }[] }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {b.href ? <Link href={b.href} className="hover:text-foreground">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

// avatar.tsx
const palettes = ['from-indigo-500 to-violet-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-sky-500 to-blue-500','from-rose-500 to-pink-500']
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm'|'md'|'lg'; className?: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?'
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const sz = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }[size]
  return <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white', palettes[idx], sz, className)}>{initials}</div>
}
```

- [ ] **Step 3: `stat-card.tsx`** (AnimatedNumber imported from `@/components/motion/animated-number`; create that file in Task 3 — to keep tsc green now, create the motion file in this task's step 3b with the implementation from Task 3 Step 3).

```tsx
'use client'
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import { Card } from './card'
import { AnimatedNumber } from '@/components/motion/animated-number'
import { cn } from '@/lib/utils'
const accents = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300',
}
export function StatCard({ label, value, suffix, delta, trend = 'neutral', icon: Icon, accent = 'indigo', className }: { label: string; value: number | string; suffix?: string; delta?: string; trend?: 'up'|'down'|'neutral'; icon: LucideIcon; accent?: keyof typeof accents; className?: string }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendCls = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <Card className={cn('p-5 transition-shadow hover:shadow-lift', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accents[accent])}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {delta && <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trendCls)}><TrendIcon className="h-3.5 w-3.5" />{delta}<span className="font-normal text-muted-foreground"> vs last week</span></p>}
    </Card>
  )
}
```

- [ ] **Step 4: Radix wrappers** — `switch.tsx`, `tabs.tsx`, `dialog.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`

```tsx
// switch.tsx
'use client'
import * as SwitchPrimitive from '@radix-ui/react-switch'
export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root ref={ref} className={cn('peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700', className)} {...props}>
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
))
Switch.displayName = 'Switch'

// tabs.tsx
'use client'
import * as TabsPrimitive from '@radix-ui/react-tabs'
export const Tabs = TabsPrimitive.Root
export const TabsList = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground', className)} {...props} />
))
export const TabsTrigger = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft', className)} {...props} />
))
export const TabsContent = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 focus-visible:outline-none', className)} {...props} />
))

// dialog.tsx
'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogContent = React.forwardRef<...>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
    <DialogPrimitive.Content ref={ref} className={cn('fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 shadow-lift duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', className)} {...props}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"><X className="h-4 w-4" /><span className="sr-only">Close</span></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
export const DialogHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col space-y-1.5 text-left', className)} {...p} />
export const DialogFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...p} />
export const DialogTitle = React.forwardRef<...>(({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />)
export const DialogDescription = React.forwardRef<...>(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />)
```
Note: `animate-in`/`fade-in-0`/`zoom-in-95` utilities come from `tailwindcss-animate`. Install it in this task: `npm i tailwindcss-animate` and add `require('tailwindcss-animate')` to `plugins` in `tailwind.config.js`.

```tsx
// tooltip.tsx
'use client'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export const TooltipContent = React.forwardRef<...>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal><TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn('z-50 overflow-hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 dark:bg-slate-100 dark:text-slate-900', className)} {...props} /></TooltipPrimitive.Portal>
))

// dropdown-menu.tsx
'use client'
import * as DM from '@radix-ui/react-dropdown-menu'
export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger
export const DropdownMenuContent = React.forwardRef<...>(({ className, sideOffset = 6, ...props }, ref) => (
  <DM.Portal><DM.Content ref={ref} sideOffset={sideOffset} className={cn('z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-lift animate-in fade-in-0 zoom-in-95', className)} {...props} /></DM.Portal>
))
export const DropdownMenuItem = React.forwardRef<...>(({ className, ...props }, ref) => (
  <DM.Item ref={ref} className={cn('relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props} />
))
export const DropdownMenuLabel = ({ className, ...p }) => <DM.Label className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)} {...p} />
export const DropdownMenuSeparator = ({ className, ...p }) => <DM.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...p} />
```
Wrap the app in `<TooltipProvider delayDuration={200}>` inside `components/providers.tsx`.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` passes.
- [ ] **Step 6: Commit** — `git commit -am "ui: composite components and Radix wrappers"` (use `git add -A frontend` first).

---

### Task 3: Motion primitives

**Files:**
- Create: `components/motion/fade-in.tsx`, `stagger.tsx`, `animated-number.tsx`, `page-transition.tsx`, `pulse.tsx`, `index.ts`

**Interfaces (produces):**
- `FadeIn({ children; delay?; y?; className?; as? })`
- `Stagger({ children; className?; delay?; gap? })` + `StaggerItem({ children; className? })`
- `AnimatedNumber({ value: number; duration?; format?: (n)=>string })`
- `PageTransition({ children })` — keyed by pathname, fade+slide.
- `Pulse({ className?; color?: string })` — dot with expanding ring for "live".

- [ ] **Step 1: `fade-in.tsx`**

```tsx
'use client'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
export function FadeIn({ children, delay = 0, y = 8, className, ...rest }: { children: React.ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={{ opacity: 0, y: reduce ? 0 : y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: `stagger.tsx`**

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
export function Stagger({ children, className, delay = 0, gap = 0.05 }: { children: React.ReactNode; className?: string; delay?: number; gap?: number }) {
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}>
      {children}
    </motion.div>
  )
}
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: reduce ? 0 : 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } }}>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: `animated-number.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
export function AnimatedNumber({ value, duration = 1, format = (n) => Math.round(n).toLocaleString() }: { value: number; duration?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!ref.current || !inView) return
    if (reduce) { ref.current.textContent = format(value); return }
    const controls = animate(0, value, { duration, ease: 'easeOut', onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v) } })
    return () => controls.stop()
  }, [value, inView, reduce, duration, format])
  return <span ref={ref}>{reduce ? format(value) : format(0)}</span>
}
```

- [ ] **Step 4: `page-transition.tsx`, `pulse.tsx`, `index.ts`**

```tsx
// page-transition.tsx
'use client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const reduce = useReducedMotion()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
// pulse.tsx
export function Pulse({ className, color = 'bg-emerald-500' }: { className?: string; color?: string }) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring', color)} />
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', color)} />
    </span>
  )
}
// index.ts
export * from './fade-in'; export * from './stagger'; export * from './animated-number'; export * from './page-transition'; export * from './pulse'
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit`.
- [ ] **Step 6: Commit** — `git add -A frontend && git commit -m "ui: motion primitives"`

---

### Task 4: App shell + route group + auth redirects

**Files:**
- Create: `app/(app)/layout.tsx`, `components/layout/app-shell.tsx`, `components/layout/sidebar.tsx` (rewrite), `components/layout/topbar.tsx`, `components/layout/theme-toggle.tsx`, `components/layout/user-menu.tsx`, `components/layout/mobile-nav.tsx`
- Move: `app/page.tsx` → `app/(app)/dashboard/page.tsx`; `app/{new-project,projects,tutorials,progress,history,settings,interactive-tutorial}` → `app/(app)/…` (`git mv`)
- Modify: `components/auth-provider.tsx` (redirect targets), `components/layout/header.tsx` (delete), every `router.push('/')` → `/dashboard`
- Create placeholder `app/page.tsx` (temporary: redirects to `/dashboard`; replaced in Task 6)

**Interfaces (produces):**
- `AppShell({ children })` renders Sidebar + Topbar + `<main>`; pages render inside `max-w-7xl px-6 py-8`.
- `useSidebar()` context: `{ collapsed, toggle, mobileOpen, setMobileOpen }`.
- Auth redirects: unauthenticated on `(app)` route → `/auth/login`; authenticated on `/auth/*` → `/dashboard`; `/` is public (landing handles its own redirect in Task 6).

- [ ] **Step 1: Move routes**

```bash
cd frontend/app && mkdir -p "(app)/dashboard" && git mv page.tsx "(app)/dashboard/page.tsx" && for d in new-project projects tutorials progress history settings interactive-tutorial; do git mv "$d" "(app)/$d"; done
grep -rl "router.push('/')" . ../components | xargs sed -i "s#router.push('/')#router.push('/dashboard')#g"
grep -rl "href=\"/\"" . ../components | xargs sed -i 's#href="/"#href="/dashboard"#g'
```

- [ ] **Step 2: `components/layout/sidebar.tsx`** (full rewrite)

```tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, PanelLeftClose, PanelLeftOpen, Sparkles, LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/components/auth-provider'
import { useSidebar } from './app-shell'

export function Sidebar() {
  const pathname = usePathname(); const router = useRouter()
  const { collapsed, toggle } = useSidebar()
  const { user, logout } = useAuth()
  return (
    <aside className={cn('hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex', collapsed ? 'w-[72px]' : 'w-64')}>
      <div className={cn('flex h-16 items-center gap-3 px-4', collapsed && 'justify-center px-0')}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-soft"><Sparkles className="h-4 w-4" /></span>
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight">CodeTutor AI</span>}
        </Link>
      </div>
      <div className={cn('px-3 pb-2', collapsed && 'px-2')}>
        <Button variant="gradient" className={cn('w-full', collapsed && 'px-0')} onClick={() => router.push('/new-project')}>
          <Plus className="h-4 w-4" />{!collapsed && 'New Project'}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const link = (
            <Link key={href} href={href} className={cn('relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', active && 'text-foreground', collapsed && 'justify-center px-0')}>
              {active && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <Icon className={cn('relative z-10 h-4 w-4', active && 'text-primary')} />
              {!collapsed && <span className="relative z-10">{label}</span>}
            </Link>
          )
          return collapsed ? <Tooltip key={href}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip> : link
        })}
      </nav>
      <div className="border-t border-border p-3">
        {user && (
          <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
            <Avatar name={user.full_name} size="sm" />
            {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.full_name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>}
            {!collapsed && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>}
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-1 w-full justify-center text-muted-foreground" onClick={toggle} aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Collapse</>}
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: `topbar.tsx`, `theme-toggle.tsx`, `user-menu.tsx`, `mobile-nav.tsx`**

```tsx
// topbar.tsx
'use client'
export function Topbar() {
  const pathname = usePathname(); const router = useRouter()
  const { setMobileOpen } = useSidebar()
  const [q, setQ] = useState('')
  const current = NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'CodeTutor AI'
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
      <p className="hidden text-sm font-medium text-muted-foreground md:block">{current}</p>
      <form className="ml-auto w-full max-w-md" onSubmit={(e) => { e.preventDefault(); router.push(`/projects?q=${encodeURIComponent(q)}`) }}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="h-9 pl-9 pr-12" />
          <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 md:block"><Kbd>/</Kbd></span>
        </div>
      </form>
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
// Keyboard: useEffect adding keydown listener — when key === '/' and target isn't an input, focus the search input (use a ref).

// theme-toggle.tsx: uses useTheme() from components/theme-provider; Button ghost icon; Sun/Moon icon with motion rotate on switch; cycles light→dark→light (system available via Settings page).

// user-menu.tsx: DropdownMenu with Avatar trigger; Label (name/email), items: Settings (router.push('/settings')), Sign out (logout()).

// mobile-nav.tsx: Dialog-less drawer: AnimatePresence + motion.aside fixed left-0 w-72 with backdrop; reuses NAV_ITEMS; closes on route change.
```

- [ ] **Step 4: `app-shell.tsx` + `app/(app)/layout.tsx`**

```tsx
// app-shell.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { Sidebar } from './sidebar'; import { Topbar } from './topbar'; import { MobileNav } from './mobile-nav'
import { PageTransition } from '@/components/motion'
const Ctx = createContext<{ collapsed: boolean; toggle: () => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void } | null>(null)
export const useSidebar = () => { const c = useContext(Ctx); if (!c) throw new Error('useSidebar outside AppShell'); return c }
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => { setCollapsed(localStorage.getItem('sidebar:collapsed') === '1') }, [])
  const toggle = () => setCollapsed(c => { localStorage.setItem('sidebar:collapsed', c ? '0' : '1'); return !c })
  return (
    <Ctx.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      <div className="flex min-h-screen bg-background">
        <Sidebar /><MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1"><div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8"><PageTransition>{children}</PageTransition></div></main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
// app/(app)/layout.tsx
import { AppShell } from '@/components/layout/app-shell'
export default function AppLayout({ children }: { children: React.ReactNode }) { return <AppShell>{children}</AppShell> }
```

- [ ] **Step 5: auth-provider redirects**

In `components/auth-provider.tsx` redirect effect:
```tsx
const isAuthPage = pathname?.startsWith('/auth/')
const isPublic = pathname === '/' || isAuthPage
if (!hasInitialized) return
if (!isAuthenticated && !isPublic) router.push('/auth/login')
else if (isAuthenticated && isAuthPage && !isLoading && user) router.push('/dashboard')
```
Also the `if (isLoading && isAuthenticated)` full-screen spinner: keep but restyle (`bg-background`, indigo spinner, text-muted-foreground).

- [ ] **Step 6: temporary `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/dashboard') }
```

- [ ] **Step 7: Strip old per-page shells** — In each moved page, delete any wrapping `<Sidebar/>`/`<Header/>` usage and outer `min-h-screen bg-gradient…` containers so pages render inside AppShell. Delete `components/layout/header.tsx`. (Pages still use old internals; they get rebuilt in later tasks.)

- [ ] **Step 8: Verify** — `npx tsc --noEmit && npm run build`; start dev server (already running on :3001; it hot reloads) and screenshot `/dashboard`, `/projects` in Chrome: sidebar + topbar present on both, active pill animates, collapse works, mobile width (390px) shows hamburger and drawer.
- [ ] **Step 9: Commit** — `git add -A frontend && git commit -m "ui: app shell, route group, dashboard at /dashboard"`

---

### Task 5: Auth pages

**Files:**
- Rewrite: `app/auth/login/page.tsx`, `app/auth/register/page.tsx`
- Create: `components/auth/auth-layout.tsx`, `components/auth/brand-panel.tsx`

**Interfaces:** `AuthLayout({ title, subtitle, children, footer })` — split layout; `BrandPanel()` right side.

- [ ] **Step 1: `auth-layout.tsx` + `brand-panel.tsx`**

```tsx
// auth-layout.tsx
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white"><Sparkles className="h-4 w-4" /></span><span className="font-semibold">CodeTutor AI</span></Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <FadeIn className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </FadeIn>
        </div>
        <p className="text-center text-xs text-muted-foreground">By continuing you agree to our Terms and Privacy Policy.</p>
      </div>
      <BrandPanel />
    </div>
  )
}
// brand-panel.tsx — hidden lg:flex; bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-900; bg-grid overlay (white lines at .08); centered content: headline "From repository to tutorial in minutes.", 3 bullet value props with CheckCircle2 icons, a floating "glass" mini card (motion.div float y ±6px loop, 6s) showing "Chapter 3 · Flow orchestration — 92% written" with a Progress bar. Reduced motion → no float.
```

- [ ] **Step 2: login page** — keep existing mutation/auth logic exactly (`authAPI.login`, `login(token)`, `router.push('/dashboard')`, toast on error). UI: `Label`+`Input` for email, password with show/hide `Button variant="ghost" size="icon"` inside relative wrapper, `Button variant="gradient" size="lg" className="w-full" loading={loginMutation.isPending}` "Sign in", footer `Don't have an account? <Link href="/auth/register" className="font-medium text-primary">Create one</Link>`.

- [ ] **Step 3: register page** — same structure with Full name/Email/Password; password strength hint (min 8 chars) shown below input; footer link to login.

- [ ] **Step 4: Verify** — screenshot `/auth/login` and `/auth/register` at desktop + 390px; wrong-password toast still shows.
- [ ] **Step 5: Commit** — `git commit -m "ui: redesign auth pages"`

---

### Task 6: Landing page

**Files:**
- Rewrite: `app/page.tsx`
- Create: `components/landing/nav.tsx`, `hero.tsx`, `product-mock.tsx`, `how-it-works.tsx`, `features.tsx`, `stats.tsx`, `cta.tsx`, `footer.tsx`

- [ ] **Step 1: `app/page.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { LandingNav } from '@/components/landing/nav'; import { Hero } from '@/components/landing/hero'; import { HowItWorks } from '@/components/landing/how-it-works'; import { Features } from '@/components/landing/features'; import { Stats } from '@/components/landing/stats'; import { CTA } from '@/components/landing/cta'; import { Footer } from '@/components/landing/footer'
export default function LandingPage() {
  const { isAuthenticated } = useAuth(); const router = useRouter()
  useEffect(() => { if (isAuthenticated) router.replace('/dashboard') }, [isAuthenticated, router])
  return (<div className="min-h-screen bg-background"><LandingNav /><main><Hero /><HowItWorks /><Features /><Stats /><CTA /></main><Footer /></div>)
}
```

- [ ] **Step 2: `nav.tsx`** — sticky, `bg-background/80 backdrop-blur border-b`; logo; links (How it works, Features) anchor to `#how`, `#features`; right: `Button variant="ghost" href="/auth/login"` "Sign in", `Button variant="gradient" href="/auth/register"` "Get started".

- [ ] **Step 3: `hero.tsx` + `product-mock.tsx`**

Hero: `section.relative.overflow-hidden.bg-grid` with radial gradient glow (`absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl`). Container `max-w-6xl py-24 md:py-32`, centered text: pill badge "Now with Groq-powered generation" (Badge info + Pulse), `h1` 48–64px "Turn any codebase into a <span class=text-gradient>guided tutorial</span>", subhead, CTA row (gradient "Generate your first tutorial" → /auth/register, outline "See how it works" → #how). Below: `<ProductMock />` in a `rounded-2xl border bg-card shadow-lift` frame, FadeIn delay .2.

ProductMock (pure client animation, no backend): a faux app window (three dots header) with left column listing files (`pocketflow/__init__.py`, `flow.py`, `nodes.py`) and right column "Generating tutorial" with a 5-step pipeline (Fetch → Abstractions → Relationships → Chapters → Export). Use `useEffect` + `setInterval` (2s) to advance `step` 0→5 then loop; each completed step shows emerald check, active shows spinner + Progress bar animating 0→100 over 2s; when step===5 show a "Tutorial ready · 4 chapters · PDF" success chip. Reduced motion: show final state statically.

- [ ] **Step 4: `how-it-works.tsx`** (`id="how"`) — 3 cards in a Stagger grid: 1 "Connect a repo" (GitHub URL or local folder) Github icon; 2 "AI maps the architecture" (abstractions + relationships) Brain icon; 3 "Read, quiz, export" (chapters, playground, PDF) BookOpen icon. Each card: number chip, icon, title, 2-line description.

- [ ] **Step 5: `features.tsx`** (`id="features"`) — 6 feature cards (grid 3×2): Language detection (20+ langs) `Code2`; Architecture recognition `Network`; Chapter-based learning `ListOrdered`; Live progress streaming `Activity`; Professional PDF export `FileDown`; Interactive quizzes & playground `Gamepad2`. Hover lift.

- [ ] **Step 6: `stats.tsx`** — band `bg-slate-900 text-white dark:bg-card` with 4 AnimatedNumber stats: `20+` languages, `5` pipeline stages, `3` export formats, `<10` min per tutorial (label text, not claims about customers).

- [ ] **Step 7: `cta.tsx` + `footer.tsx`** — CTA card with gradient background, headline "Ready to onboard engineers 10× faster?", buttons. Footer: logo, © year, links (Sign in, GitHub repo link `https://github.com/mynkchaudhry/Repocourseai`).

- [ ] **Step 8: Verify** — screenshots of `/` full page (scroll) desktop + 390px; logged-in visit redirects to `/dashboard`; `npx tsc --noEmit`.
- [ ] **Step 9: Commit** — `git commit -m "ui: public landing page"`

---

### Task 7: Dashboard

**Files:**
- Rewrite: `app/(app)/dashboard/page.tsx`, `components/dashboard/stats-cards.tsx`, `recent-projects.tsx`, `active-jobs.tsx`, `activity-chart.tsx`; delete `dashboard-content.tsx`, `quick-actions.tsx`

Data: `tutorialAPI.getDashboardStats()` (`DashboardStats`: `stats.{total_projects,completed_projects,processing_projects,success_rate}.{value,change,trend}`, `active_jobs[]`, `recent_activity[]`), `tutorialAPI.getProjects()` for recent list (sort by created_at desc, take 5). Poll stats every 5s while any job processing (`refetchInterval`).

- [ ] **Step 1: page** — `PageHeader title={`Good ${partOfDay}, ${firstName}`} description="Here's what's happening with your tutorials." actions={<Button variant="gradient" href="/new-project"><Plus/>New Project</Button>}`; `<StatsCards />`; grid `lg:grid-cols-3`: `<RecentProjects className="lg:col-span-2" />`, `<ActiveJobs />`; `<ActivityChart />` full width.

- [ ] **Step 2: stats-cards** — 4 `StatCard`s in `Stagger` grid `sm:grid-cols-2 xl:grid-cols-4`: Total projects (FolderOpen, indigo), Completed (CheckCircle2, emerald), Processing (Loader2, amber), Success rate (TrendingUp, sky, string value). Loading → 4 `Skeleton h-[120px]`; error → `Alert variant="error"` with retry button calling `refetch`.

- [ ] **Step 3: recent-projects** — Card with header (title, "View all" link → /projects); list rows: source icon (Github/HardDrive), name, `Badge` from `statusMeta`, inline `Progress` if processing, `relativeTime(created_at)`, chevron; row click → `/projects/[id]` (or `/progress/[job_id]` when processing/pending). Empty → `EmptyState icon={FolderPlus} title="No projects yet" description="Generate your first tutorial from a GitHub repo or local folder." action={<Button href="/new-project">New Project</Button>}`.

- [ ] **Step 4: active-jobs** — Card; each job: `Pulse`, project name (fallback `Job ${id.slice(0,8)}`), current_step, `Progress value`, `%`, updated time; click → `/progress/[id]`. Keep existing data mapping from `active_jobs` fields (`id`/`job_id`, `name`, `current_step`, `progress`, `updated_at`). Empty → small muted text "No active jobs" with Zap icon.

- [ ] **Step 5: activity-chart** — keep recharts; restyle: `AreaChart` with indigo gradient fill, `CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"`, tooltip styled with card colors. Source data unchanged from existing component (derive from `recent_activity` or projects by day as currently done).

- [ ] **Step 6: Verify** — screenshot dashboard light/dark, loading skeleton visible on hard reload; with test user data (projects exist) and fresh user (empty states).
- [ ] **Step 7: Commit** — `git commit -m "ui: dashboard redesign"`

---

### Task 8: New Project flow

**Files:**
- Rewrite: `app/(app)/new-project/page.tsx`, `components/project/project-form.tsx`
- Create: `components/project/source-step.tsx`, `configure-step.tsx`, `chip-input.tsx`, `step-indicator.tsx`
- Rewrite: `components/github/repository-search.tsx` → `repository-search-dialog.tsx`

**Interfaces:** `ProjectForm()` owns state `ProjectConfig` + `step: 0|1`; on submit `tutorialAPI.createProject(config)` → `router.push(`/progress/${job_id}`)`. `ChipInput({ value: string[]; onChange; placeholder })`. `RepositorySearchDialog({ open; onOpenChange; onSelect(repo: GitHubRepo) })` using `githubAPI.searchRepositories`.

- [ ] **Step 1: page** — `PageHeader title="New Project" description="Point CodeTutor AI at a codebase and we'll write the tutorial." breadcrumbs=[Dashboard→/dashboard, New Project]`; `<ProjectForm />`.

- [ ] **Step 2: `step-indicator.tsx`** — two steps "Source" / "Configure"; active circle filled primary, completed shows Check, connecting line animates `scaleX` via motion when step advances.

- [ ] **Step 3: `source-step.tsx`** — `Tabs` (GitHub repository / Local directory). GitHub: `Label` "Repository URL", `Input` with Github icon prefix + `Button variant="outline"` "Browse GitHub" opening the dialog; `Input` GitHub token (password, optional, helper text). Local: `Input` absolute path + helper. Validation: require repo_url (regex `^https://github\.com/[^/]+/[^/]+`) or local_dir; show inline error text under input (rose-600). `Button` "Continue" (disabled until valid).

- [ ] **Step 4: `configure-step.tsx`** — grid: Project name (optional), Language `Select` (english, spanish, french, german, chinese, japanese, hindi), Max abstractions `input type=range` 3–15 styled `accent-indigo-600` + numeric readout, Max file size `Input type=number` with "bytes" suffix, Include patterns `ChipInput` (default `*.py, *.js, *.ts, *.go, *.java, *.rs`), Exclude patterns `ChipInput` (default `tests/*, docs/*, node_modules/*, *.test.*`), `Switch` "Use LLM cache". Footer sticky bar: `Button variant="outline"` Back, `Button variant="gradient" loading` "Generate tutorial" (Sparkles icon).

- [ ] **Step 5: `chip-input.tsx`** — renders chips (`Badge variant="secondary"` with X) + inline `Input`; Enter/comma adds, Backspace on empty removes last.

- [ ] **Step 6: `repository-search-dialog.tsx`** — `Dialog` (max-w-2xl): search Input (debounced 400ms), language Select (any, Python, JavaScript, TypeScript, Go, Rust, Java), results list (name, description 2-line clamp, stars/forks/language chips, updated relativeTime) — click row → `onSelect(repo)` sets `repo_url = repo.html_url` and closes; loading skeleton rows; empty state; error alert.

- [ ] **Step 7: Verify** — screenshot both steps; validation messages; dialog open; submit navigates to `/progress/<id>` (use a small public repo).
- [ ] **Step 8: Commit** — `git commit -m "ui: new project flow"`

---

### Task 9: Progress page (pipeline viz + live logs)

**Files:**
- Rewrite: `app/(app)/progress/[jobId]/page.tsx`
- Create: `components/progress/pipeline-viz.tsx`, `log-stream.tsx`, `lib/api.ts` add `getStreamUrl(jobId)`

**Interfaces:** `PipelineViz({ currentStep?: string; progress: number; status })` maps `current_step` text → stage index: contains "Fetch"→0, "abstraction"→1, "relationship"→2, "chapter"/"Writing"→3, "Processing results"/"Combin"/progress≥90→4, completed→5. `LogStream({ logs: LogEntry[] })`. `getStreamUrl(jobId)` returns `${API_BASE}/status/${jobId}/stream?token=${encodeURIComponent(Cookies.get('access_token') ?? '')}` — **fixes the existing bug where the page read `localStorage.getItem('token')` (never set) so SSE never connected.**

- [ ] **Step 1: `lib/api.ts`** add:
```ts
export function getStreamUrl(jobId: string): string {
  const token = Cookies.get('access_token') ?? ''
  return `${API_BASE}/status/${jobId}/stream?token=${encodeURIComponent(token)}`
}
```

- [ ] **Step 2: `pipeline-viz.tsx`**

```tsx
'use client'
const STAGES = [
  { key: 'fetch', label: 'Fetch repo', icon: GitBranch },
  { key: 'abstractions', label: 'Identify abstractions', icon: Boxes },
  { key: 'relationships', label: 'Map relationships', icon: Network },
  { key: 'chapters', label: 'Write chapters', icon: PenLine },
  { key: 'combine', label: 'Assemble tutorial', icon: BookCheck },
]
export function stageIndex(currentStep = '', progress = 0, status = 'processing'): number {
  if (status === 'completed') return STAGES.length
  const s = currentStep.toLowerCase()
  if (s.includes('fetch')) return 0
  if (s.includes('abstraction')) return 1
  if (s.includes('relationship')) return 2
  if (s.includes('chapter') || s.includes('writing')) return 3
  if (s.includes('result') || s.includes('combin') || s.includes('saving') || progress >= 90) return 4
  return 0
}
export function PipelineViz({ currentStep, progress, status }: { currentStep?: string; progress: number; status: string }) {
  const active = stageIndex(currentStep, progress, status); const failed = status === 'failed'
  return (
    <ol className="grid grid-cols-5 gap-2">
      {STAGES.map((st, i) => {
        const done = i < active; const isActive = i === active && !failed && status !== 'completed'
        const Icon = st.icon
        return (
          <li key={st.key} className="relative flex flex-col items-center text-center">
            {i < STAGES.length - 1 && (
              <div className="absolute left-1/2 top-5 -z-10 h-0.5 w-full bg-border">
                <motion.div className="h-full bg-gradient-primary" initial={{ scaleX: 0 }} animate={{ scaleX: done ? 1 : 0 }} style={{ transformOrigin: 'left' }} transition={{ duration: 0.6 }} />
              </div>
            )}
            <motion.div animate={{ scale: isActive ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card', done && 'border-emerald-500 bg-emerald-500 text-white', isActive && 'border-primary text-primary shadow-glow', !done && !isActive && 'border-border text-muted-foreground', failed && i === active && 'border-rose-500 text-rose-500')}>
              {done ? <Check className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </motion.div>
            <p className={cn('mt-2 text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{st.label}</p>
          </li>
        )
      })}
    </ol>
  )
}
```

- [ ] **Step 3: `log-stream.tsx`** — `Card` with header "Live log" + `Pulse` when processing; body `div.max-h-80.overflow-auto.font-mono.text-xs.bg-slate-950.text-slate-200.rounded-lg.p-4`; each entry: time `HH:mm:ss` muted, level colored (INFO slate-400, WARN amber-400, ERROR rose-400), message; auto-scroll to bottom on new logs (`useEffect` + `ref.scrollTop = scrollHeight`) unless user scrolled up (track `atBottom`). Empty → "Waiting for logs…".

- [ ] **Step 4: page** — keep existing data logic: `useQuery(['job', jobId], () => tutorialAPI.getJobStatus(jobId), { refetchInterval: (q) => status in ['completed','failed'] ? false : 3000 })` plus `EventSource(getStreamUrl(jobId))` merging pushed status into query cache (`queryClient.setQueryData`). UI: `PageHeader title={project name ?? 'Generating tutorial'} description={source url} breadcrumbs` actions: `Badge` status; Card "Pipeline" with `<PipelineViz/>`, below it `Progress value` + `%` + current step + elapsed timer (from first log timestamp); two-column: `<LogStream/>` (2/3) + side Card "Details" (job id copyable, started, repo, language, max abstractions from project config if available); when completed → `Alert variant="success"` with buttons "Open tutorial" (`/projects/<project id>` — find via `tutorialAPI.getProjects()` where `job_id === jobId`) and "Download PDF"; when failed → `Alert variant="error"` with error text + "Try again" → `/new-project`.

- [ ] **Step 5: Verify** — start a job from New Project; watch pipeline advance + logs stream (Network tab shows `/stream` 200); completion card appears; `npx tsc --noEmit && npm run build`.
- [ ] **Step 6: Commit** — `git commit -m "ui: progress page with pipeline visualization and SSE fix"`

---

### Task 10: Projects & Tutorials lists

**Files:**
- Rewrite: `app/(app)/projects/page.tsx`, `app/(app)/tutorials/page.tsx`
- Create: `components/projects/project-card.tsx`, `project-row.tsx`, `projects-toolbar.tsx`, `delete-project-dialog.tsx`

**Interfaces:** `ProjectCard({ project: Project; onDelete(id) })`, `ProjectRow` (list view), `ProjectsToolbar({ query, onQuery, status, onStatus, view, onView })`, `DeleteProjectDialog({ project | null; onOpenChange; onConfirm })`.

- [ ] **Step 1: projects page** — read `?q=` from `useSearchParams()` as initial query; `useQuery(['projects'], tutorialAPI.getProjects)`; filter by name/source contains query and status; sort newest first; toolbar (search Input, status Select all/completed/processing/failed, view toggle grid/list via two icon Buttons); grid view `Stagger` `sm:grid-cols-2 xl:grid-cols-3` of `ProjectCard`; list view table-like rows; loading → 6 skeleton cards; empty (no projects) → EmptyState with CTA; empty (filtered) → "No matches" EmptyState with "Clear filters". Delete: `useMutation(tutorialAPI.deleteProject)` invalidates `['projects']`, toast.

- [ ] **Step 2: `project-card.tsx`** — Card hover lift; header: source icon, name (truncate), `DropdownMenu` (Open, Download PDF (`tutorialAPI.downloadProjectPDF` → blob download), Delete); body: source url/dir muted mono text, `Badge` status, `Progress` if processing, footer: chapters count (`project.result?.chapters?.length`), `relativeTime(created_at)`. Whole card click → `/projects/[id]` (processing → `/progress/[job_id]`).

- [ ] **Step 3: tutorials page** — same components; data = projects filtered `status === 'completed'`; PageHeader "Tutorials"; extra stat strip (3 StatCards: Tutorials, Chapters written (sum), Languages (distinct config.language)).

- [ ] **Step 4: Verify** — screenshots grid/list, filters, delete dialog, empty states.
- [ ] **Step 5: Commit** — `git commit -m "ui: projects and tutorials lists"`

---

### Task 11: Project detail / Tutorial reader

**Files:**
- Rewrite: `app/(app)/projects/[id]/page.tsx`
- Create: `components/tutorial/markdown.tsx`, `chapter-nav.tsx`, `reader.tsx`, `abstractions-panel.tsx`, `export-menu.tsx`

**Interfaces:** `Markdown({ content })` — react-markdown + remark-gfm + rehype-highlight, components override `pre` to add copy button; `ChapterNav({ chapters: {title}[]; active; onSelect })`; `Reader({ project })`; `ExportMenu({ project })` (PDF via `downloadProjectPDF`, Markdown/HTML via `exportTutorial`).

- [ ] **Step 1: `markdown.tsx`**

```tsx
'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { Copy, Check } from 'lucide-react'
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null); const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      <pre ref={ref} {...props}>{children}</pre>
      <button onClick={() => { navigator.clipboard.writeText(ref.current?.innerText ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="absolute right-2 top-2 rounded-md bg-white/10 p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100" aria-label="Copy code">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
    </div>
  )
}
export function Markdown({ content }: { content: string }) {
  return <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:text-primary prose-pre:p-0"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: Pre }}>{content}</ReactMarkdown></div>
}
```
Chapter title extraction helper: `chapterTitle(md) = (md.match(/^#\s+(.+)$/m)?.[1] ?? 'Chapter').trim()`.

- [ ] **Step 2: page** — `useQuery(['project', id], () => tutorialAPI.getProject(id))`; header: breadcrumbs (Projects → name), title, description source; actions: `ExportMenu`, `Button href="/new-project" variant="outline"`. If not completed → card with PipelineViz snapshot + link to progress. If completed: `Tabs` Overview / Chapters / Abstractions.
  - Overview: stat strip (chapters, abstractions, language, generated relativeTime), relationships summary (`result.relationships.summary`) in prose, abstraction chips.
  - Chapters (default tab): layout `lg:grid-cols-[240px_1fr]`: sticky `ChapterNav` (titles from `result.chapters` via `chapterTitle`, active highlight, keyboard ↑↓), main `Reader` showing the selected chapter with prev/next buttons at bottom and animated chapter switch (`AnimatePresence` fade). Scroll to top on chapter change.
  - Abstractions: cards per abstraction (name, description, file indices as chips); relationships list (from→to label) rendered as simple rows with ArrowRight.
- [ ] **Step 3: `export-menu.tsx`** — `DropdownMenu` trigger `Button variant="gradient"` "Export" → items PDF / Markdown / HTML; loading state toast; trigger blob download (reuse existing `handleDownload` logic).
- [ ] **Step 4: Verify** — open completed project (test user `pocketflow`): chapters render with code highlighting + copy; tabs work; PDF download returns 200.
- [ ] **Step 5: Commit** — `git commit -m "ui: tutorial reader and project detail"`

---

### Task 12: History, Settings, Interactive tutorial

**Files:**
- Rewrite: `app/(app)/history/page.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/interactive-tutorial/page.tsx`; reskin `components/interactive/*.jsx` classnames to kit tokens (no logic change).

- [ ] **Step 1: history** — data `getProjects()` sorted desc; filter chips All/Completed/Failed/Processing; grouped by day ("Today", "Yesterday", date); each row: timeline dot colored by `statusMeta.dot`, name, source, status Badge, duration (`completed_at - created_at` formatted `m s`), link. Stagger.
- [ ] **Step 2: settings** — keep existing state/mutation logic (`getSettings/updateSettings`, fields default_language, max_file_size, cache_enabled, max_abstractions, auto_save, theme, notifications, github_token). UI: left anchor nav (Profile, Generation, Appearance, Integrations) sticky; sections as Cards with `Label`/`Input`/`Select`/`Switch`; Appearance: 3 radio cards (Light/Dark/System) that call `setTheme` immediately; sticky bottom save bar appears when dirty (`motion` slide-up) with "Save changes" `loading`.
- [ ] **Step 3: interactive-tutorial** — wrap in `PageHeader` + Cards; replace old gradient/dark classes with tokens (`bg-card`, `border-border`, `text-muted-foreground`); buttons → `Button`.
- [ ] **Step 4: Verify** — screenshots; settings save round-trip works; theme radio switches instantly.
- [ ] **Step 5: Commit** — `git commit -m "ui: history, settings, interactive tutorial"`

---

### Task 13: Polish, dark mode, responsive, final verification

- [ ] **Step 1: Dark pass** — open every route in dark; fix contrast issues (gradients on dark, chart colors, code blocks).
- [ ] **Step 2: Responsive pass** — 390px: landing, auth, dashboard, new-project, progress, projects, reader (chapter nav becomes a `Select` above content on `<lg`).
- [ ] **Step 3: Remove dead code** — delete unused components (`dashboard-content.tsx`, `quick-actions.tsx`, `header.tsx`, old `repository-search.tsx`), unused CSS keyframes, `enhanced-syntax-test.pdf` stays untouched. `grep -rn "font-barlow\|from-slate-950\|Barlow" app components` must return nothing.
- [ ] **Step 4: Build & lint** — `npm run build` and `npm run lint` clean (no new errors; pre-existing warnings acceptable, list them).
- [ ] **Step 5: Full demo walkthrough in Chrome** — landing → register new user → dashboard (empty states) → new project (small public repo) → progress (pipeline + logs) → completed → reader → export PDF → projects list → settings theme → sign out. Capture screenshots to `docs/superpowers/screenshots/`? No — keep screenshots in scratchpad and send the key ones to the user via SendUserFile.
- [ ] **Step 6: Commit** — `git commit -m "ui: polish, dark mode, responsive fixes"`; report summary + screenshots.

---

## Self-review

- **Spec coverage:** tokens/typography (T0), kit (T1–2), motion (T3), shell + routing (T4), auth (T5), landing (T6), dashboard (T7), new project incl. GitHub dialog (T8), progress pipeline viz + log stream + SSE (T9), projects/tutorials lists (T10), reader with chapter nav/prose/code copy/export (T11), history/settings/interactive (T12), dark mode + responsive + build/lint/walkthrough (T13). Error/empty/loading states are called out per page. ✔
- **Placeholders:** none; each task has concrete structure/code. Radix wrapper `React.forwardRef<...>` generics are written as `React.forwardRef<React.ElementRef<typeof X>, React.ComponentPropsWithoutRef<typeof X>>` for each primitive — implementer fills the exact primitive per component (shown fully for Switch).
- **Type consistency:** `statusMeta` returns `BadgeVariant` used by `Badge`; `Progress` prop `value`; `StatCard` uses `AnimatedNumber` (created in T2 Step 3b from T3 code); `getStreamUrl` in `lib/api.ts` consumed in T9; `useSidebar` exported from `app-shell.tsx` consumed by sidebar/topbar/mobile-nav. ✔
