import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { THIRTY_MIN_SLOTS } from '../../lib/timeSlots'
import type { PreferredTimeSlot } from '../../types'

function slotMatchesQuery(slot: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const normalized = slot.toLowerCase().replace(/[–-]/g, ' ')
  const compact = normalized.replace(/[: ]/g, '')
  const qCompact = q.replace(/[: ]/g, '')
  return normalized.includes(q) || compact.includes(qCompact)
}

export function TimeSlotMultiSelect({
  label,
  value,
  onChange,
}: {
  label?: string
  value: PreferredTimeSlot[]
  onChange: (next: PreferredTimeSlot[]) => void
}) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)

  const options = useMemo(() => {
    const available = THIRTY_MIN_SLOTS.filter((s) => !value.includes(s))
    return available.filter((s) => slotMatchesQuery(s, q))
  }, [q, value])

  const showList = focused && options.length > 0

  const addSlot = (slot: PreferredTimeSlot) => {
    onChange([...value, slot].sort())
    setQ('')
  }

  return (
    <div>
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}

      {value.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((slot) => (
            <span
              key={slot}
              className="inline-flex items-center gap-2 rounded-full bg-healix-teal/10 px-3 py-1 text-xs font-semibold text-healix-navy"
            >
              {slot}
              <button
                type="button"
                className="rounded-full p-0.5 text-healix-navy/70 transition-all duration-200 hover:bg-white/60 hover:text-healix-navy"
                aria-label={`Remove ${slot}`}
                onClick={() => onChange(value.filter((v) => v !== slot))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 150)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && options[0]) {
              e.preventDefault()
              addSlot(options[0])
            }
            if (e.key === 'Escape') {
              setQ('')
              setFocused(false)
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          placeholder="Type to filter slots (e.g. 09:00, 14:30)…"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
          aria-label={label ?? 'Search time slots'}
          aria-expanded={showList}
          aria-autocomplete="list"
        />

        {showList ? (
          <ul
            className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-gray-100 bg-white p-1 shadow-soft"
            role="listbox"
          >
            {options.map((slot) => (
              <li key={slot} role="option">
                <button
                  type="button"
                  className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSlot(slot)}
                >
                  {slot}
                </button>
              </li>
            ))}
          </ul>
        ) : focused && q.trim() && options.length === 0 ? (
          <div className="absolute z-30 mt-1 w-full rounded-2xl border border-gray-100 bg-white px-3 py-3 text-sm text-slate-500 shadow-soft">
            No matching slots.
          </div>
        ) : null}
      </div>

      {!value.length ? (
        <p className="mt-1.5 text-xs text-slate-500">
          Type in the field to filter — selections appear above.
        </p>
      ) : null}
    </div>
  )
}
