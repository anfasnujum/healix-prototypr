import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="healix-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
          {hint ? <div className="mt-1 text-sm text-slate-500">{hint}</div> : null}
        </div>
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-healix-teal/10 text-healix-teal">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  )
}

