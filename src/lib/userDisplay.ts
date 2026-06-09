import type { User, UserRole } from '../types'

export function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function roleLabel(role: UserRole): string {
  return role === 'admin' ? 'Admin' : 'Case Manager'
}

export function roleBadgeClass(role: UserRole): string {
  return role === 'admin'
    ? 'bg-violet-50 text-violet-800'
    : 'bg-sky-50 text-sky-800'
}

export function statusBadgeClass(status: User['status']): string {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-800'
    : 'bg-slate-100 text-slate-600'
}
