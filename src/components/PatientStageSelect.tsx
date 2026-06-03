import type { PatientStage } from '../types'

export const STAGE_OPTIONS: { value: PatientStage; label: string }[] = [
  { value: 'fresh', label: 'Fresh' },
  { value: 'unattended', label: "Didn't Pick Up" },
  { value: 'active', label: 'Active' },
  { value: 'cold', label: 'Cold' },
]

export function stageSelectClass(stage: PatientStage) {
  switch (stage) {
    case 'fresh':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'unattended':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'active':
      return 'border-sky-200 bg-sky-50 text-sky-800'
    case 'cold':
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function stageButtonClass(stage: PatientStage, selected: boolean) {
  if (!selected) {
    return 'border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:bg-gray-50'
  }
  return stageSelectClass(stage)
}

export function PatientStageButtons({
  value,
  onChange,
}: {
  value: PatientStage
  onChange: (stage: PatientStage) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Stage
      </span>
      {STAGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200',
            stageButtonClass(opt.value, value === opt.value),
          ].join(' ')}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function PatientStageSelect({
  value,
  onChange,
  patientName,
  className,
}: {
  value: PatientStage
  onChange: (stage: PatientStage) => void
  patientName?: string
  className?: string
}) {
  return (
    <select
      className={[
        'h-9 min-w-[140px] rounded-lg border px-2.5 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-healix-teal/20',
        stageSelectClass(value),
        className ?? '',
      ].join(' ')}
      value={value}
      onChange={(e) => onChange(e.target.value as PatientStage)}
      aria-label={patientName ? `Stage for ${patientName}` : 'Stage'}
    >
      {STAGE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
