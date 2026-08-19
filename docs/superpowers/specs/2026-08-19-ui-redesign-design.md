# CodeTutor AI — Frontend Redesign (Investor-Ready)

**Date:** 2026-08-19  
**Scope:** `frontend/` only. Backend API contract (`lib/api.ts`) is unchanged.  
**Goal:** A consistent, polished, light "clean SaaS" UI with purposeful motion, a public landing page, and a demo flow that works end-to-end: landing → login → dashboard → new project → live progress → tutorial reader → PDF export.

## 1. Approach

Design-system-first rebuild. Build a small in-repo UI kit and one application shell, then rebuild every page on top of them. Data fetching (`lib/api.ts`, react-query hooks, auth provider semantics) is reused as-is.

Not in scope: backend changes, new API endpoints, full shadcn/ui adoption, i18n.

## 2. Visual language

| Token | Value |
|---|---|
| Canvas | `#FAFAFA` (`--background`) |
| Surface | `#FFFFFF` with `1px slate-200` border, `rounded-xl` (12px) |
| Text | `slate-900` primary, `slate-600` body, `slate-500` muted |
| Primary | indigo `#4F46E5`; hover `#4338CA`; gradient `indigo-600 → violet-600` only for primary CTA + hero accents |
| Status | emerald (success/completed), amber (processing/pending), rose (failed), sky (info) |
| Shadows | `shadow-sm` default, `shadow-md` on hover/elevated, soft layered shadow for hero mock |
| Radius | 12px cards, 8px inputs/buttons, full for pills/avatars |
| Type | **Inter** via `next/font/google`; Barlow Condensed removed. Display sizes: 36/30/24; body 14/16; mono `ui-monospace` for code/ids |
| Dark mode | kept through existing CSS variables (`.dark`); light is the designed default, dark must remain legible (re-tuned variables) |

## 3. Component kit (`components/ui/`)

`button` (variants: primary, secondary, ghost, outline, destructive; sizes sm/md/lg; loading state), `card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter), `input`, `textarea`, `select` (native styled), `switch` (Radix, existing dep), `tabs` (Radix), `dialog` (Radix), `tooltip` (Radix), `dropdown-menu` (Radix), `badge` (status variants), `progress` (animated bar), `skeleton`, `empty-state` (icon, title, description, action), `page-header` (title, description, actions, breadcrumb), `stat-card` (label, value w/ animated counter, delta, icon), `avatar`, `separator`, `kbd`.

Motion primitives (`components/motion/`): `FadeIn` (y-offset + opacity), `Stagger` + `StaggerItem` (list reveals), `AnimatedNumber` (counter), `PageTransition` (route-level wrapper), `Pulse` (live indicators). All honor `prefers-reduced-motion` via `useReducedMotion`.

## 4. Application shell (`components/layout/`)

- `AppShell` wraps every authenticated route via a route group `app/(app)/layout.tsx`.
- `Sidebar`: logo, "New Project" primary CTA, nav (Dashboard, Projects, Tutorials, History, Settings) with active indicator (animated `layoutId` pill), collapsible to icon rail (state persisted in localStorage), user card + sign-out at bottom. On mobile: off-canvas drawer.
- `Topbar`: breadcrumb/page title, search input (client-side filter on projects/tutorials pages; otherwise navigates to /projects?q=), theme toggle, notifications bell (static), avatar menu.
- Content: `max-w-7xl` centered, 24–32px padding, consistent vertical rhythm.

## 5. Routing

| Route | Before | After |
|---|---|---|
| `/` | dashboard (auth-gated) | **public landing**; authenticated users redirected to `/dashboard` |
| `/dashboard` | — | dashboard |
| `/auth/login`, `/auth/register` | standalone | redesigned split layout (form left, brand panel right) |
| `/new-project`, `/projects`, `/projects/[id]`, `/tutorials`, `/progress/[jobId]`, `/history`, `/settings`, `/interactive-tutorial` | mixed shells | all inside `AppShell` |

All internal links that pointed to `/` as "home" now point to `/dashboard`. Auth provider: unauthenticated access to any `(app)` route → `/auth/login`; authenticated visit to `/auth/*` or `/` → `/dashboard`.

## 6. Pages

- **Landing `/`:** sticky nav (logo, links, Sign in, Get started); hero (headline, subhead, two CTAs, animated product mock showing a repo turning into chapters — pure CSS/framer, no backend); "How it works" 3 steps (Connect repo → AI analyzes → Tutorial + PDF); feature grid (6 cards); stats band (animated numbers: languages supported, minutes to tutorial, export formats); final CTA; footer.
- **Auth:** split layout; left form card with inline validation & loading button; right brand panel with gradient, product value props and a subtle animated grid. Error toast on bad credentials (existing fix stays).
- **Dashboard:** page header with greeting + "New Project"; 4 stat cards (animated); 2-column: Recent projects (list with status badge, progress, relative time) + Active jobs (live progress, pipeline step label, click → progress page); activity chart (existing data, restyled); rich empty states with CTA.
- **New Project:** two-step card (Source → Configure) with step indicator; source tabs GitHub URL / Local directory; GitHub search opens a dialog with results list; configure: name, language, max abstractions (slider + number), max file size, include/exclude patterns (chip inputs), cache toggle; sticky footer with Back / Generate; on submit → `/progress/[jobId]`.
- **Progress:** header with project name + status badge; **pipeline visualization** (5 nodes: Fetch → Abstractions → Relationships → Chapters → Combine; active node pulses, completed fill, connecting lines animate); overall progress bar + %, current step, elapsed time; live log stream (SSE, existing) in a monospace panel with auto-scroll; on complete: success card with "Open tutorial" / "Download PDF"; on fail: error card with retry link.
- **Projects:** header + search + status filter + grid/list toggle; project cards (name, source icon, status, progress, created, actions menu: open, PDF, delete with confirm dialog); skeleton grid while loading; empty state.
- **Tutorials:** same card system, showing chapter count and last generated; open → project detail.
- **Project detail / Tutorial reader:** left chapter nav (sticky, active chapter highlight, scroll-spy), center prose (`@tailwindcss/typography`-style classes hand-written if plugin absent; code blocks with copy button), right meta panel (abstractions list, relationships summary, export PDF / Markdown buttons); tabs: Overview / Chapters / Abstractions.
- **History:** timeline list of jobs (status, duration, repo) with filters.
- **Settings:** sectioned form (Profile, Generation defaults, Appearance, Integrations—GitHub token status) with save bar.
- **Interactive tutorial:** restyled inside shell; existing components reskinned with kit tokens.

## 7. Motion rules

- Page mount: content `FadeIn` (y 8px, 0.3s, ease-out). Lists: stagger 40ms.
- Hover: cards lift 2px + shadow-md (150ms). Buttons: scale 0.98 on press.
- Counters animate once on mount; progress bars animate width.
- Pipeline viz: node activation 0.4s spring; line fill 0.6s.
- No looping decorative animation except the landing hero mock and live "processing" pulses.
- Respect reduced motion: all transforms disabled, opacity fades only.

## 8. Error handling & states

Every data view has loading (skeleton), empty (EmptyState with CTA), error (inline alert with retry). Mutations show loading buttons and toast on success/failure. 401 handling unchanged.

## 9. Testing / verification

- `npm run build` passes with no TS errors; `npm run lint` clean of new errors.
- Chrome walkthrough of the full demo flow at 1440px and 390px widths, light and dark, with screenshots checked visually.
- No console errors on any page.
- Existing backend tests still pass (unchanged).

## 10. Delivery

Work happens on a branch `ui-redesign`, committed in logical steps (kit → shell → pages → landing). Final: screenshots + summary for the user.
