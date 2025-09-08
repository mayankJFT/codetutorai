'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  FolderOpen, 
  Settings, 
  History, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Github,
  HardDrive,
  Sparkles,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: FolderOpen, label: 'Projects', href: '/projects' },
  { icon: History, label: 'History', href: '/history' },
  { icon: BookOpen, label: 'Tutorials', href: '/tutorials' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={{ width: open ? 280 : 80 }}
        animate={{ width: open ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <motion.div 
            className="flex items-center gap-3"
            animate={{ justifyContent: open ? 'flex-start' : 'center' }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="font-barlow font-bold text-xl tracking-tight">CODETUTOR AI</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Advanced Code Learning</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* New Project Button */}
        <div className="p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/new-project')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
              "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
              "hover:from-blue-600 hover:to-purple-700 transition-all",
              "shadow-lg hover:shadow-xl",
              !open && "justify-center px-3"
            )}
          >
            <Plus className="w-5 h-5" />
            {open && <span className="font-barlow font-semibold">New Project</span>}
          </motion.button>
        </div>

        {/* Quick Actions */}
        {open && (
          <div className="px-4 mb-4">
            <p className="text-xs font-barlow font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Quick Start
            </p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Github className="w-4 h-4" />
                <span className="text-sm font-barlow">From GitHub</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <HardDrive className="w-4 h-4" />
                <span className="text-sm font-barlow">Local Directory</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4">
          {open && (
            <p className="text-xs font-barlow font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Navigation
            </p>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <button
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      isActive && "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400",
                      !open && "justify-center"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "text-blue-600 dark:text-blue-400")} />
                    {open && (
                      <span className={cn(
                        "font-barlow font-medium",
                        isActive && "text-blue-600 dark:text-blue-400"
                      )}>
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          {open ? (
            <ChevronLeft className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </motion.aside>
    </AnimatePresence>
  )
}