'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Lock, 
  Globe, 
  Database, 
  Github, 
  FileText,
  Palette,
  Bell,
  Download,
  Upload,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tutorialAPI, authAPI, type AuthUser } from '@/lib/api'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import toast from 'react-hot-toast'

interface UserSettings {
  email: string
  full_name: string
  current_password: string
  new_password: string
  confirm_password: string
}

interface AppSettings {
  default_language: string
  max_file_size: number
  cache_enabled: boolean
  max_abstractions: number
  github_token: string
  auto_save: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
}

const LANGUAGES = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 
  'chinese', 'japanese', 'korean', 'russian', 'hindi', 'arabic'
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    email: '',
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [appSettings, setAppSettings] = useState<AppSettings>({
    default_language: 'english',
    max_file_size: 100000,
    cache_enabled: true,
    max_abstractions: 10,
    github_token: '',
    auto_save: true,
    theme: 'system',
    notifications: true,
  })

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: tutorialAPI.getSettings,
  })

  // Initialize user settings when current user data is available
  useEffect(() => {
    if (currentUser) {
      setUserSettings(prev => ({
        ...prev,
        email: currentUser.email,
        full_name: currentUser.full_name,
      }))
    }
  }, [currentUser])

  // Initialize app settings when settings data is available
  useEffect(() => {
    if (settings) {
      setAppSettings(prev => ({
        ...prev,
        default_language: settings.default_language || 'english',
        max_file_size: Number(settings.max_file_size) || 100000,
        cache_enabled: settings.cache_enabled ?? true,
        max_abstractions: Number(settings.max_abstractions) || 10,
        github_token: '', // Don't show the actual token for security
      }))
    }
  }, [settings])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; email: string; current_password?: string; new_password?: string }) => {
      // This would typically be a separate API endpoint for updating profile
      // For now, we'll simulate success
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Profile updated successfully')
      setUserSettings(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }))
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AppSettings) => {
      return tutorialAPI.updateSettings(data)
    },
    onSuccess: () => {
      toast.success('Settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save settings')
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userSettings.new_password && userSettings.new_password !== userSettings.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    if (userSettings.new_password && !userSettings.current_password) {
      toast.error('Current password is required to set a new password')
      return
    }

    const updateData: any = {
      full_name: userSettings.full_name,
      email: userSettings.email,
    }

    if (userSettings.new_password) {
      updateData.current_password = userSettings.current_password
      updateData.new_password = userSettings.new_password
    }

    updateProfileMutation.mutate(updateData)
  }

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate(appSettings)
  }

  const exportSettings = () => {
    const exportData = {
      appSettings,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `codetutor-ai-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Settings exported successfully')
  }

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.appSettings) {
          setAppSettings(data.appSettings)
          toast.success('Settings imported successfully')
        } else {
          toast.error('Invalid settings file format')
        }
      } catch (error) {
        toast.error('Failed to import settings file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your account and application preferences
              </p>
            </div>
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 mb-8 overflow-x-auto">
            <Tabs.Trigger
              value="profile"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800 whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              Profile
            </Tabs.Trigger>
            <Tabs.Trigger
              value="preferences"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800 whitespace-nowrap"
            >
              <Globe className="w-4 h-4" />
              Preferences
            </Tabs.Trigger>
            <Tabs.Trigger
              value="generation"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Generation
            </Tabs.Trigger>
            <Tabs.Trigger
              value="integrations"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all data-[state=active]:bg-slate-100 data-[state=active]:dark:bg-slate-800 whitespace-nowrap"
            >
              <Github className="w-4 h-4" />
              Integrations
            </Tabs.Trigger>
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Content value="profile">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userSettings.full_name}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={userSettings.current_password}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, current_password: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={userSettings.new_password}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, new_password: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={userSettings.confirm_password}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Tabs.Content>

          {/* Preferences Tab */}
          <Tabs.Content value="preferences">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance & Behavior
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold">Theme</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose your preferred theme
                      </p>
                    </div>
                    <select
                      value={appSettings.theme}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold">Auto-save Projects</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Automatically save project configurations
                      </p>
                    </div>
                    <Switch.Root
                      checked={appSettings.auto_save}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, auto_save: checked }))}
                      className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-emerald-500 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                    </Switch.Root>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold">Notifications</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Receive notifications for completed tutorials
                      </p>
                    </div>
                    <Switch.Root
                      checked={appSettings.notifications}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, notifications: checked }))}
                      className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-emerald-500 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                    </Switch.Root>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Import & Export
                </h2>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={exportSettings}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Settings
                  </button>
                  
                  <label className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* Generation Tab */}
          <Tabs.Content value="generation">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tutorial Generation Settings
              </h2>

              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Default Language
                    </label>
                    <select
                      value={appSettings.default_language}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, default_language: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Max File Size (bytes)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      value={Number.isNaN(appSettings.max_file_size) ? 100000 : appSettings.max_file_size}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, max_file_size: parseInt(e.target.value) || 100000 }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Max Abstractions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={Number.isNaN(appSettings.max_abstractions) ? 10 : appSettings.max_abstractions}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, max_abstractions: parseInt(e.target.value) || 10 }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold">Enable LLM Caching</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cache LLM responses to speed up generation
                      </p>
                    </div>
                    <Switch.Root
                      checked={appSettings.cache_enabled}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, cache_enabled: checked }))}
                      className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-emerald-500 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                    </Switch.Root>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Tabs.Content>

          {/* Integrations Tab */}
          <Tabs.Content value="integrations">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Github className="w-5 h-5" />
                External Integrations
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={appSettings.github_token}
                    onChange={(e) => setAppSettings(prev => ({ ...prev, github_token: e.target.value }))}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">Required for:</p>
                        <ul className="text-xs space-y-0.5 ml-4">
                          <li>• Accessing private repositories</li>
                          <li>• Avoiding GitHub API rate limits</li>
                          <li>• Enhanced repository search results</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {settings?.github_token_configured && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      GitHub token is configured
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => updateSettingsMutation.mutate(appSettings)}
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Integration Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}