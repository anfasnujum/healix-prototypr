import { Link } from 'react-router-dom'
import { MoreVertical, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Client } from '../types'
import { StatusBadge } from './StatusBadge'
import { Modal } from './modals/Modal'
import { Button } from './ui/Button'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}

export function ClientCard({
  client,
  registeredPatients,
  onDelete,
}: {
  client: Client
  registeredPatients: number
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const avatarStyle = useMemo(
    () => ({ backgroundColor: `${client.brandColor}1A`, color: client.brandColor }),
    [client.brandColor],
  )

  return (
    <div className="group relative healix-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold"
            style={avatarStyle}
            aria-hidden="true"
          >
            {initials(client.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/clients/${client.id}`}
                className="truncate text-sm font-semibold text-slate-900 transition-all duration-200 hover:text-healix-teal"
              >
                {client.name}
              </Link>
              <StatusBadge active={client.status === 'active'} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {client.industry}
              </span>
              <span className="text-slate-400">•</span>
              <span>{registeredPatients} patients</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-gray-50 hover:text-slate-700"
            aria-label="Client actions"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-soft"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 transition-all duration-200 hover:bg-rose-50"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Delete client?"
        description="This removes the client and its patients from the mock dataset."
        onClose={() => setConfirmOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false)
                onDelete()
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          You’re about to delete <span className="font-semibold">{client.name}</span>.
        </div>
      </Modal>
    </div>
  )
}

