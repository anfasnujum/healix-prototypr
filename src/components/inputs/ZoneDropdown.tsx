import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { OMAN_ZONES } from '../../mock/constants'
import type { Zone } from '../../types'

export function ZoneDropdown({
  label,
  value,
  onChange,
}: {
  label?: string
  value?: Zone
  onChange: (zone: Zone) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const options = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return OMAN_ZONES
    return OMAN_ZONES.filter((z) => z.toLowerCase().includes(query))
  }, [q])

  return (
    <div className="relative">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 text-left text-sm text-slate-900 transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-healix-teal/20"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? '' : 'text-slate-400'}>
          {value ?? 'Select zone…'}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

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
              placeholder="Search…"
              className="h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-auto p-1">
            {options.map((z) => (
              <button
                key={z}
                type="button"
                className={[
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-200',
                  z === value
                    ? 'bg-healix-teal/10 text-healix-navy'
                    : 'text-slate-700 hover:bg-gray-50',
                ].join(' ')}
                onClick={() => {
                  onChange(z)
                  setOpen(false)
                  setQ('')
                }}
              >
                {z}
              </button>
            ))}
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500">
                No matches.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

