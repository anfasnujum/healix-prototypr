import type { ReactNode } from 'react'
import type { PreferredDate, PreferredTimeSlot, Symptom, Zone } from '../types'

function formatDateLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PreferenceSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-800">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function EmptyPreference() {
  return <p className="text-sm text-slate-500">Not specified on the call.</p>
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-gray-200">
      {children}
    </span>
  )
}

export function CallPreferencesDisplay({
  zone,
  symptoms,
  dates,
  timeSlots,
}: {
  zone?: Zone
  symptoms?: Symptom[]
  dates?: PreferredDate[]
  timeSlots?: PreferredTimeSlot[]
}) {
  const hasSymptoms = symptoms && symptoms.length > 0
  const hasDates = dates && dates.length > 0
  const hasTimes = timeSlots && timeSlots.length > 0

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        From last case manager call
      </div>

      <PreferenceSection label="Zone">
        {zone ? (
          <Chip>{zone}</Chip>
        ) : (
          <EmptyPreference />
        )}
      </PreferenceSection>

      <PreferenceSection label="Symptoms">
        {hasSymptoms ? (
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        ) : (
          <EmptyPreference />
        )}
      </PreferenceSection>

      <PreferenceSection label="Preferred Dates">
        {hasDates ? (
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <Chip key={d}>{formatDateLabel(d)}</Chip>
            ))}
          </div>
        ) : (
          <EmptyPreference />
        )}
      </PreferenceSection>

      <PreferenceSection label="Preferred Time Range">
        {hasTimes ? (
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <Chip key={slot}>{slot}</Chip>
            ))}
          </div>
        ) : (
          <EmptyPreference />
        )}
      </PreferenceSection>
    </div>
  )
}
