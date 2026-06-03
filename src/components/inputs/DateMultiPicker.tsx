import { X } from 'lucide-react'
import { useState } from 'react'

function formatDateLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DateMultiPicker({
  label,
  value,
  onChange,
}: {
  label?: string
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const addDate = (isoDate: string) => {
    if (!isoDate || value.includes(isoDate)) {
      setDraft('')
      return
    }
    onChange([...value, isoDate].sort())
    setDraft('')
  }

  return (
    <div>
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}

      {value.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-2 rounded-full bg-healix-teal/10 px-3 py-1 text-xs font-semibold text-healix-navy"
            >
              {formatDateLabel(d)}
              <button
                type="button"
                className="rounded-full p-0.5 text-healix-navy/70 transition-all duration-200 hover:bg-white/60 hover:text-healix-navy"
                aria-label={`Remove ${formatDateLabel(d)}`}
                onClick={() => onChange(value.filter((v) => v !== d))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <input
        type="date"
        value={draft}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          if (next) addDate(next)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft) {
            e.preventDefault()
            addDate(draft)
          }
        }}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
        aria-label={label ?? 'Add preferred date'}
      />

      {!value.length ? (
        <p className="mt-1.5 text-xs text-slate-500">
          Type a date or use the calendar — selections appear above.
        </p>
      ) : null}
    </div>
  )
}
