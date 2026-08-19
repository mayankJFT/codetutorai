'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, type RegisterData } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState<RegisterData>({ email: '', password: '', full_name: '' })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authAPI.register(data),
    onSuccess: (response) => {
      login(response.access_token)
      toast.success('Account created — welcome aboard!')
      setTimeout(() => router.push('/dashboard'), 100)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Registration failed')
    },
  })

  const strong = formData.password.length >= 8

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in all fields')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    registerMutation.mutate(formData)
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start turning codebases into tutorials in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={formData.full_name}
            onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
            disabled={registerMutation.isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            disabled={registerMutation.isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            disabled={registerMutation.isPending}
            required
          />
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full transition-all', formData.password.length === 0 ? 'w-0' : strong ? 'w-full bg-emerald-500' : 'w-1/3 bg-amber-500')}
              />
            </div>
            <span className="text-xs text-muted-foreground">{formData.password.length === 0 ? '' : strong ? 'Strong' : 'Weak'}</span>
          </div>
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" loading={registerMutation.isPending}>
          Create account {!registerMutation.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
