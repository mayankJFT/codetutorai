'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, type LoginData } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' })

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authAPI.login(data),
    onSuccess: (response) => {
      login(response.access_token)
      toast.success('Welcome back!')
      setTimeout(() => router.push('/dashboard'), 100)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Login failed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }
    loginMutation.mutate(formData)
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your CodeTutor AI workspace."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            disabled={loginMutation.isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            disabled={loginMutation.isPending}
            required
          />
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loginMutation.isPending}>
          Sign in {!loginMutation.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
