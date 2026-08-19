'use client'

import { motion } from 'framer-motion'
import { Github, HardDrive, Upload, Globe, Book, Settings2 } from 'lucide-react'

const actions = [
  {
    icon: Github,
    label: 'Import from GitHub',
    description: 'Generate from repository',
    color: 'from-slate-700 to-slate-900',
  },
  {
    icon: HardDrive,
    label: 'Local Directory',
    description: 'Use local codebase',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: Upload,
    label: 'Upload Archive',
    description: 'ZIP or TAR file',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: Globe,
    label: 'From URL',
    description: 'Public repository URL',
    color: 'from-green-500 to-green-700',
  },
  {
    icon: Book,
    label: 'Templates',
    description: 'Pre-configured setups',
    color: 'from-orange-500 to-orange-700',
  },
  {
    icon: Settings2,
    label: 'Advanced Config',
    description: 'Custom parameters',
    color: 'from-pink-500 to-pink-700',
  },
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold">Quick Actions</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Start a new tutorial project
        </p>
      </div>

      <div className="p-6 grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                {action.label}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {action.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}