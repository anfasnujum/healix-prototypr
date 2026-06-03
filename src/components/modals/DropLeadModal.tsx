import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../ui/Button'

export type DropLeadModalProps = {
  open: boolean
  patientName?: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function DropLeadModal({
  open,
  patientName,
  onClose,
  onConfirm,
}: DropLeadModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  const trimmed = reason.trim()
  const canConfirm = trimmed.length > 0

  return (
    <Modal
      open={open}
      title="Drop lead?"
      description="The patient will be marked as Cold and removed from your bench pool. This will be recorded in the activity log."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Keep on bench
          </Button>
          <Button
            variant="danger"
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return
              onConfirm(trimmed)
            }}
          >
            Drop lead
          </Button>
        </div>
      }
    >
      {patientName ? (
        <div className="mb-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{patientName}</span>
        </div>
      ) : null}
      <label className="block text-sm font-semibold text-slate-900" htmlFor="drop-lead-reason">
        Reason
      </label>
      <textarea
        id="drop-lead-reason"
        className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you dropping this lead? (required)"
      />
    </Modal>
  )
}
