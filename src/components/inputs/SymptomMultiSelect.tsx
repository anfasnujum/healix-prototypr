import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SYMPTOMS } from '../../mock/constants'
import type { Symptom } from '../../types'

export function SymptomMultiSelect({
  label,
  value,
  onChange,
}: {
  label?: string
  value: Symptom[]
  onChange: (next: Symptom[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const options = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base = query
      ? SYMPTOMS.filter((s) => s.toLowerCase().includes(query))
      : SYMPTOMS
    return base.filter((s) => !value.includes(s))
  }, [q, value])

  return (
    <div className="relative">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}

      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-healix-teal/20"
        onClick={() => setOpen(true)}
      >
        <span className={value.length ? 'text-slate-900' : 'text-slate-400'}>
          {value.length ? 'Add or edit symptoms…' : 'Select symptoms…'}
        </span>
        <Search className="h-4 w-4 text-slate-400" />
      </button>

      {value.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full bg-healix-teal/10 px-3 py-1 text-xs font-semibold text-healix-navy"
            >
              {s}
              <button
                type="button"
                className="rounded-full p-0.5 text-healix-navy/70 transition-all duration-200 hover:bg-white/60 hover:text-healix-navy"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(value.filter((v) => v !== s))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search…"
              className="h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              autoFocus
            />
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-gray-50"
              onClick={() => {
                setOpen(false)
                setQ('')
              }}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-56 overflow-auto p-1">
            {options.map((s) => (
              <button
                key={s}
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:bg-gray-50"
                onClick={() => onChange([...value, s])}
              >
                {s}
              </button>
            ))}
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500">
                {q.trim() ? 'No matches.' : 'All symptoms selected.'}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

