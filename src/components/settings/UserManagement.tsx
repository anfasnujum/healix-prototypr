import { KeyRound, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../modals/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { roleBadgeClass, roleLabel, statusBadgeClass } from '../../lib/userDisplay'
import { useHealixStore } from '../../store/useHealixStore'
import type { User, UserRole } from '../../types'

type RoleFilter = 'all' | UserRole

type UserForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

const emptyForm = (): UserForm => ({
  name: '',
  email: '',
  password: '',
  role: 'case_manager',
})

const selectClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20'

export function UserManagement() {
  const users = useHealixStore((s) => s.users)
  const currentUserId = useHealixStore((s) => s.currentUserId)
  const addUser = useHealixStore((s) => s.addUser)
  const updateUser = useHealixStore((s) => s.updateUser)
  const setUserPassword = useHealixStore((s) => s.setUserPassword)
  const setUserStatus = useHealixStore((s) => s.setUserStatus)
  const deleteUser = useHealixStore((s) => s.deleteUser)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const [form, setForm] = useState<UserForm>(emptyForm)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...users]
      .filter((u) => roleFilter === 'all' || u.role === roleFilter)
      .filter((u) => {
        if (!q) return true
        return [u.name, u.email, roleLabel(u.role)].some((v) =>
          v.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [users, query, roleFilter])

  const caseManagerCount = users.filter((u) => u.role === 'case_manager').length
  const activeCount = users.filter((u) => u.status === 'active').length

  const resetForm = () => {
    setForm(emptyForm())
    setFormError('')
  }

  const emailTaken = (email: string, excludeId?: string) =>
    users.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== excludeId,
    )

  const openAdd = () => {
    resetForm()
    setAddOpen(true)
  }

  const openEdit = (user: User) => {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    })
    setFormError('')
    setEditUser(user)
  }

  const openPassword = (user: User) => {
    setNewPassword('')
    setConfirmPassword('')
    setFormError('')
    setPasswordUser(user)
  }

  const handleAdd = () => {
    const name = form.name.trim()
    const email = form.email.trim()
    const password = form.password.trim()

    if (!name || !email || !password) {
      setFormError('Name, email, and password are required.')
      return
    }
    if (emailTaken(email)) {
      setFormError('A user with this email already exists.')
      return
    }

    addUser({
      name,
      email,
      password,
      role: form.role,
      status: 'active',
    })
    setAddOpen(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!editUser) return
    const name = form.name.trim()
    const email = form.email.trim()

    if (!name || !email) {
      setFormError('Name and email are required.')
      return
    }
    if (emailTaken(email, editUser.id)) {
      setFormError('A user with this email already exists.')
      return
    }
    if (editUser.id === currentUserId && form.role !== 'admin') {
      setFormError('You cannot change your own role away from admin.')
      return
    }

    updateUser(editUser.id, {
      name,
      email,
      role: form.role,
    })
    setEditUser(null)
    resetForm()
  }

  const handlePasswordChange = () => {
    if (!passwordUser) return
    const password = newPassword.trim()
    const confirm = confirmPassword.trim()

    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }

    setUserPassword(passwordUser.id, password)
    setPasswordUser(null)
    setNewPassword('')
    setConfirmPassword('')
    setFormError('')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteUser(deleteTarget.id)
    setDeleteTarget(null)
  }

  const userFormFields = (includePassword: boolean) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Fatima Al-Rashdi"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="name@healix.om"
      />
      {includePassword ? (
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Min. 6 characters"
          className="md:col-span-2"
        />
      ) : null}
      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-800">Role</div>
        <select
          className={selectClass}
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
          disabled={editUser?.id === currentUserId}
        >
          <option value="case_manager">Case Manager</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {formError ? (
        <p className="text-sm text-rose-700 md:col-span-2">{formError}</p>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {caseManagerCount} case managers · {activeCount} active users
        </p>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:max-w-sm">
          <Input
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['case_manager', 'Case Managers'],
              ['admin', 'Admins'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleFilter(value)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                roleFilter === value
                  ? 'bg-healix-navy text-white'
                  : 'bg-white text-slate-600 ring-1 ring-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="healix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user.id} className="text-slate-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-healix-navy/5 text-xs font-semibold text-healix-navy">
                        {user.name
                          .split(/\s+/)
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <span className="truncate">{user.name}</span>
                          {user.id === currentUserId ? (
                            <span className="rounded-full bg-healix-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-healix-navy">
                              You
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                        roleBadgeClass(user.role),
                      ].join(' ')}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                        statusBadgeClass(user.status),
                      ].join(' ')}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(user)}
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPassword(user)}
                        title="Change password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setUserStatus(
                            user.id,
                            user.status === 'active' ? 'inactive' : 'active',
                          )
                        }
                        disabled={user.id === currentUserId}
                        title={
                          user.status === 'active' ? 'Deactivate user' : 'Activate user'
                        }
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(user)}
                        disabled={user.id === currentUserId}
                        title="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Add User"
        description="Create a new case manager or admin account."
        onClose={() => {
          setAddOpen(false)
          resetForm()
        }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setAddOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Create Account</Button>
          </div>
        }
      >
        {userFormFields(true)}
      </Modal>

      <Modal
        open={!!editUser}
        title="Edit User"
        description="Update account details. Use the key icon to change the password."
        onClose={() => {
          setEditUser(null)
          resetForm()
        }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setEditUser(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        }
      >
        {userFormFields(false)}
      </Modal>

      <Modal
        open={!!passwordUser}
        title="Change Password"
        description={
          passwordUser
            ? `Set a new password for ${passwordUser.name}.`
            : undefined
        }
        onClose={() => {
          setPasswordUser(null)
          setNewPassword('')
          setConfirmPassword('')
          setFormError('')
        }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setPasswordUser(null)
                setNewPassword('')
                setConfirmPassword('')
                setFormError('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>Update Password</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title="Delete User"
        description={
          deleteTarget
            ? `Permanently remove ${deleteTarget.name}? This cannot be undone.`
            : undefined
        }
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete User
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          The user will lose access immediately. Any historical case manager activity will
          remain in patient records.
        </p>
      </Modal>
    </div>
  )
}
