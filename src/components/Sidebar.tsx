import { NavLink } from 'react-router-dom'
import {
  Building2,
  ClipboardList,
  Hospital,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react'
import { roleLabel, userInitials } from '../lib/userDisplay'
import { useHealixStore } from '../store/useHealixStore'

function SidebarLink({
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
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-white/10 text-healix-teal'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200',
              isActive ? 'bg-healix-teal' : 'bg-transparent',
            ].join(' ')}
          />
          <Icon
            className={[
              'h-4 w-4 transition-all duration-200',
              isActive ? 'text-healix-teal' : 'text-white/70 group-hover:text-white',
            ].join(' ')}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const users = useHealixStore((s) => s.users)
  const currentUserId = useHealixStore((s) => s.currentUserId)
  const currentUser = users.find((u) => u.id === currentUserId)

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] bg-healix-navy text-white">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="px-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10">
              <span className="relative block h-2 w-2 rounded-full bg-healix-teal">
                <span className="absolute inset-0 animate-ping rounded-full bg-healix-teal/60" />
              </span>
            </span>
            <div className="font-display text-xl font-semibold tracking-tight">
              healix
            </div>
          </div>
          <div className="mt-5 h-px bg-white/10" />
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-2">
          <SidebarLink to="/" label="Dashboard" icon={LayoutDashboard} />
          <SidebarLink to="/bench" label="Bench" icon={ClipboardList} />
          <SidebarLink to="/patients" label="Patients" icon={Users} />
          <SidebarLink to="/clients" label="Clients" icon={Building2} />
          <SidebarLink to="/hospitals" label="Hospitals" icon={Hospital} />
          <SidebarLink to="/doctors" label="Doctors" icon={Stethoscope} />
        </nav>

        <div className="mt-auto px-2">
          <div className="mb-3 h-px bg-white/10" />
          <SidebarLink to="/settings" label="Settings" icon={Settings} />
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-sm font-semibold text-white">
                {currentUser ? userInitials(currentUser.name) : '—'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {currentUser?.name ?? 'Unknown User'}
                </div>
                <div className="truncate text-xs text-white/60">
                  {currentUser ? roleLabel(currentUser.role) : '—'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

