import type { TimelineEvent } from '../types'

const typeStyle: Record<
  TimelineEvent['type'],
  { label: string; dot: string }
> = {
  ai_call: { label: 'AI Call', dot: 'bg-purple-500' },
  cm_call: { label: 'Case Manager Call', dot: 'bg-healix-teal' },
  appointment_booked: { label: 'Appointment Booked', dot: 'bg-blue-500' },
  patient_added: { label: 'Patient Added', dot: 'bg-slate-400' },
  priority_changed: { label: 'Priority Changed', dot: 'bg-amber-500' },
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="healix-card px-6 py-6">
      <div className="space-y-5">
        {events.map((e, idx) => {
          const s = typeStyle[e.type]
          return (
            <div key={e.id} className="flex gap-4">
              <div className="w-28 shrink-0 pt-0.5 text-xs text-slate-500">
                <div>{new Date(e.at).toLocaleDateString()}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {new Date(e.at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="relative flex shrink-0 flex-col items-center">
                <div className={['h-2.5 w-2.5 rounded-full', s.dot].join(' ')} />
                {idx < events.length - 1 ? (
                  <div className="mt-2 h-full w-px bg-gray-200" />
                ) : null}
              </div>

              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {s.label}
                  </span>
                  <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{e.description}</div>
              </div>
            </div>
          )
        })}

        {events.length === 0 ? (
          <div className="text-sm text-slate-500">No activity yet.</div>
        ) : null}
      </div>
    </div>
  )
}

