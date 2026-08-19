import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || ''
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    // A 401 from login/register means bad credentials: let the form show the
    // error. Only treat 401s on other routes as an expired/invalid session.
    if (error.response?.status === 401 && !isAuthAttempt) {
      Cookies.remove('access_token')
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface ProjectConfig {
  repo_url?: string
  local_dir?: string
  project_name?: string
  github_token?: string
  include_patterns?: string[]
  exclude_patterns?: string[]
  max_file_size?: number
  language?: string
  use_cache?: boolean
  max_abstractions?: number
}

export interface Project {
  id: string
  job_id?: string
  name: string
  type: 'github' | 'local'
  source: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_step?: string
  created_at: string
  completed_at?: string
  error?: string
  output_dir?: string
  config: ProjectConfig
  result?: ProjectResult
}

export interface Abstraction {
  name: string
  description: string
  files: number[]
}

export interface ProjectResult {
  abstractions: Abstraction[]
  relationships: {
    summary: string
    details: Array<{
      from: number
      to: number
      label: string
    }>
  }
  chapters: string[]
  output_dir: string
}

export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  step: string
  progress: number
}

export interface JobStatus {
  id: string
  name?: string
  source?: string
  type?: 'github' | 'local'
  created_at?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_step?: string
  result?: ProjectResult
  error?: string
  logs?: LogEntry[]
}

class TutorialAPI {
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/dashboard/stats')
    return data
  }

  async createProject(config: ProjectConfig): Promise<{ job_id: string }> {
    const { data } = await api.post('/generate', config)
    return data
  }

  async generateTutorial(config: ProjectConfig): Promise<{ job_id: string }> {
    const { data } = await api.post('/generate', config)
    return data
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const { data } = await api.get(`/status/${jobId}`)
    return data
  }

  async getProjects(): Promise<Project[]> {
    const { data } = await api.get('/projects')
    return data
  }

  async getProject(id: string): Promise<Project> {
    const { data } = await api.get(`/projects/${id}`)
    return data
  }

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  }

  async getTutorialContent(projectId: string, chapterIndex?: number): Promise<string> {
    const path = chapterIndex !== undefined 
      ? `/projects/${projectId}/chapters/${chapterIndex}`
      : `/projects/${projectId}/tutorial`
    const { data } = await api.get(path)
    return data
  }

  async updateTutorialContent(projectId: string, chapterIndex: number, content: string): Promise<void> {
    await api.put(`/projects/${projectId}/chapters/${chapterIndex}`, { content })
  }

  async exportTutorial(projectId: string, format: 'markdown' | 'pdf' | 'html'): Promise<Blob> {
    const { data } = await api.get(`/projects/${projectId}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return data
  }

  async downloadProjectPDF(projectId: string): Promise<Blob> {
    const { data } = await api.get(`/projects/${projectId}/download/pdf`, {
      responseType: 'blob',
    })
    return data
  }

  async getTutorials(): Promise<any[]> {
    const { data } = await api.get('/tutorials')
    return data
  }

  async getTutorial(tutorialId: string): Promise<any> {
    const { data } = await api.get(`/tutorials/${tutorialId}`)
    return data
  }

  async downloadTutorialPDF(tutorialId: string): Promise<Blob> {
    const { data } = await api.get(`/tutorials/${tutorialId}/download/pdf`, {
      responseType: 'blob',
    })
    return data
  }

  async deleteTutorial(tutorialId: string): Promise<void> {
    await api.delete(`/tutorials/${tutorialId}`)
  }

  async getSettings(): Promise<any> {
    const { data } = await api.get('/settings')
    return data
  }

  async updateSettings(settings: any): Promise<void> {
    await api.put('/settings', settings)
  }
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  created_at: string
  is_active: boolean
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  clone_url: string
  stars: number
  forks: number
  language: string
  updated_at: string
  size: number
}

export interface GitHubSearchResponse {
  total_count: number
  repositories: GitHubRepo[]
}

export interface GitHubSearchParams {
  query: string
  language?: string
  sort?: string
  order?: string
  per_page?: number
}

export interface DashboardStats {
  stats: {
    total_projects: {
      value: number
      change: string
      trend: 'up' | 'down' | 'neutral'
    }
    completed_projects: {
      value: number
      change: string
      trend: 'up' | 'down' | 'neutral'
    }
    processing_projects: {
      value: number
      change: string
      trend: 'up' | 'down' | 'neutral'
    }
    success_rate: {
      value: string
      change: string
      trend: 'up' | 'down' | 'neutral'
    }
  }
  active_jobs: Array<{
    id: string
    name?: string
    source?: string
    type?: 'github' | 'local'
    status: string
    progress: number
    current_step?: string
    created_at: string
    updated_at: string
  }>
  recent_activity: Array<{
    id: string
    name: string
    status: string
    created_at: string
    completed_at?: string
  }>
}

class AuthAPI {
  async login(data: LoginData): Promise<AuthResponse> {
    const { data: response } = await api.post('/auth/login', data)
    return response
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { data: response } = await api.post('/auth/register', data)
    return response
  }

  async getCurrentUser(): Promise<AuthUser> {
    const { data } = await api.get('/auth/me')
    return data
  }

  logout(): void {
    Cookies.remove('access_token')
    window.location.href = '/auth/login'
  }

  setToken(token: string): void {
    Cookies.set('access_token', token, { expires: 1 })
  }

  getToken(): string | undefined {
    return Cookies.get('access_token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

class GitHubAPI {
  async searchRepositories(params: GitHubSearchParams): Promise<GitHubSearchResponse> {
    const { data } = await api.post('/github/search', params)
    return data
  }
}

export const authAPI = new AuthAPI()
export const githubAPI = new GitHubAPI()
export const tutorialAPI = new TutorialAPI()