import type { PriorityLevel } from '../types'

export function PriorityBadge({ level }: { level: PriorityLevel }) {
  const cfg: Record<
    PriorityLevel,
    { label: string; className: string; dot: string }
  > = {
    urgent: {
      label: 'Urgent',
      className: 'bg-rose-50 text-rose-800 ring-rose-200',
      dot: 'bg-rose-500',
    },
    moderate: {
      label: 'Moderate',
      className: 'bg-amber-50 text-amber-800 ring-amber-200',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'Low',
      className: 'bg-teal-50 text-teal-800 ring-teal-200',
      dot: 'bg-healix-teal',
    },
    none: {
      label: 'None',
      className: 'bg-gray-100 text-gray-700 ring-gray-200',
      dot: 'bg-gray-400',
    },
  }
  const c = cfg[level]
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        c.className,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', c.dot].join(' ')} />
      {c.label}
    </span>
  )
}

