import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../ui/Button'

export const DROP_LEAD_REASONS = [
  'Patient not picking up',
  'Unable to find suitable appointment',
  'Doctors unavailable in the zone',
  'Patient rejected service',
  'Other',
] as const

export type DropLeadReason = (typeof DROP_LEAD_REASONS)[number]

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
  const [reasonChoice, setReasonChoice] = useState<DropLeadReason | ''>('')
  const [otherReason, setOtherReason] = useState('')

  useEffect(() => {
    if (!open) {
      setReasonChoice('')
      setOtherReason('')
    }
  }, [open])

  const resolvedReason =
    reasonChoice === 'Other' ? otherReason.trim() : reasonChoice
  const canConfirm =
    reasonChoice !== '' &&
    (reasonChoice !== 'Other' || otherReason.trim().length > 0)

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
              onConfirm(resolvedReason)
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
      <select
        id="drop-lead-reason"
        className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
        value={reasonChoice}
        onChange={(e) => setReasonChoice(e.target.value as DropLeadReason | '')}
      >
        <option value="">Select a reason…</option>
        {DROP_LEAD_REASONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {reasonChoice === 'Other' ? (
        <label className="mt-4 block" htmlFor="drop-lead-other-reason">
          <span className="text-sm font-semibold text-slate-900">Please specify</span>
          <textarea
            id="drop-lead-other-reason"
            className="mt-2 h-24 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Enter reason…"
          />
        </label>
      ) : null}
    </Modal>
  )
}
