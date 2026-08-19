'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authAPI, type AuthUser } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Check if user is authenticated on mount
  useEffect(() => {
    const authenticated = authAPI.isAuthenticated()
    setIsAuthenticated(authenticated)
    setHasInitialized(true)
  }, [])

  // Fetch current user data
  const { data: user, isLoading, refetch, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated && hasInitialized,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if ((error as any)?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Handle authentication errors
  useEffect(() => {
    if ((error as any)?.response?.status === 401) {
      setIsAuthenticated(false)
      authAPI.logout()
    }
  }, [error])

  const login = (token: string) => {
    authAPI.setToken(token)
    setIsAuthenticated(true)
    // Trigger immediate refetch of user data
    refetch()
  }

  const logout = () => {
    authAPI.logout()
    setIsAuthenticated(false)
  }

  // Redirect logic
  useEffect(() => {
    const isAuthPage = pathname?.startsWith('/auth/')
    const isPublic = pathname === '/' || isAuthPage

    // Only redirect after initialization is complete
    if (!hasInitialized) return

    if (!isAuthenticated && !isPublic) {
      router.push('/auth/login')
    } else if (isAuthenticated && isAuthPage && !isLoading && user) {
      // Only redirect away from auth pages if we have user data and not loading
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, pathname, router, user, hasInitialized])

  // Show loading spinner on initial load
  if (isLoading && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}