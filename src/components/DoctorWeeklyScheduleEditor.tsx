import { useEffect, useState } from 'react'
import { TimeSlotMultiSelect } from './inputs/TimeSlotMultiSelect'
import { Button } from './ui/Button'
import { WEEKDAY_ROWS } from '../lib/doctorSchedule'
import type { DoctorWeeklySchedule, PreferredTimeSlot, Weekday } from '../types'

export function DoctorWeeklyScheduleEditor({
  schedule,
  onSave,
}: {
  schedule: DoctorWeeklySchedule
  onSave: (slotsByWeekday: DoctorWeeklySchedule['slotsByWeekday']) => void
}) {
  const [draft, setDraft] = useState(schedule.slotsByWeekday)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(schedule.slotsByWeekday)
    setDirty(false)
  }, [schedule.doctorId, schedule.slotsByWeekday])

  const setDaySlots = (weekday: Weekday, slots: PreferredTimeSlot[]) => {
    setDraft((prev) => {
      const next = { ...prev }
      if (slots.length === 0) {
        delete next[weekday]
      } else {
        next[weekday] = slots
      }
      return next
    })
    setDirty(true)
  }

  const toggleDay = (weekday: Weekday, enabled: boolean) => {
    if (enabled) {
      setDaySlots(weekday, draft[weekday] ?? ['09:00–09:30', '10:00–10:30'])
    } else {
      setDaySlots(weekday, [])
    }
  }

  return (
    <div className="space-y-4">
      {WEEKDAY_ROWS.map(({ weekday, label }) => {
        const slots = draft[weekday] ?? []
        const enabled = slots.length > 0
        return (
          <div
            key={weekday}
            className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-healix-teal focus:ring-healix-teal/30"
                  checked={enabled}
                  onChange={(e) => toggleDay(weekday, e.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-900">{label}</span>
              </label>
              {enabled ? (
                <span className="text-xs font-medium text-slate-500">
                  {slots.length} slot{slots.length === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">Not available</span>
              )}
            </div>
            {enabled ? (
              <div className="mt-3">
                <TimeSlotMultiSelect
                  label="Time slots"
                  value={slots}
                  onChange={(next) => setDaySlots(weekday, next)}
                />
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button
          variant="secondary"
          disabled={!dirty}
          onClick={() => {
            setDraft(schedule.slotsByWeekday)
            setDirty(false)
          }}
        >
          Reset
        </Button>
        <Button
          disabled={!dirty}
          onClick={() => {
            onSave(draft)
            setDirty(false)
          }}
        >
          Save schedule
        </Button>
      </div>
    </div>
  )
}
