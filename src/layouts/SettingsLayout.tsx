import { ArrowLeft, LogOut, UserCog } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { roleLabel, userInitials } from '../lib/userDisplay'
import { useHealixStore } from '../store/useHealixStore'

function SettingsNavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-healix-navy text-white'
            : 'text-slate-600 hover:bg-gray-50',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export function SettingsLayout() {
  const users = useHealixStore((s) => s.users)
  const currentUserId = useHealixStore((s) => s.currentUserId)
  const currentUser = users.find((u) => u.id === currentUserId)

  return (
    <div className="min-h-screen bg-healix-surface">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-gray-200 bg-white">
        <div className="px-4 py-5">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </NavLink>
          <div className="mt-5 flex items-center gap-2 px-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-healix-navy/5">
              <span className="relative block h-2 w-2 rounded-full bg-healix-teal">
                <span className="absolute inset-0 animate-ping rounded-full bg-healix-teal/60" />
              </span>
            </span>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-slate-900">
                Settings
              </div>
              <div className="text-xs text-slate-500">Healix admin</div>
            </div>
          </div>
          <div className="mt-5 h-px bg-gray-100" />
        </div>

        <nav className="flex flex-col gap-1 px-4">
          <SettingsNavLink to="/settings" label="User Management" icon={UserCog} />
        </nav>

        <div className="mt-auto border-t border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-healix-navy/10 text-sm font-semibold text-healix-navy">
                {currentUser ? userInitials(currentUser.name) : '—'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {currentUser?.name ?? 'Unknown User'}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {currentUser ? roleLabel(currentUser.role) : '—'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pl-[240px]">
        <div className="mx-auto max-w-[1080px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
