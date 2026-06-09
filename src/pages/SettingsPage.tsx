import { UserManagement } from '../components/settings/UserManagement'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          User Management
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage case manager accounts, admin access, and passwords.
        </p>
      </div>

      <div className="healix-card p-6">
        <UserManagement />
      </div>
    </div>
  )
}
