import type { AIRecommendation } from '../types'

export function AIRecommendationCard({
  rec,
}: {
  rec: AIRecommendation
}) {
  return (
    <div className="healix-frost border-l-4 border-l-healix-teal p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-healix-teal">
        ✦ AI Recommendation
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">
        Recommended Department: <span className="font-semibold">{rec.department}</span>
      </div>
      <div className="mt-3 space-y-2">
        {rec.suggestedDoctors.slice(0, 2).map((d) => (
          <div key={d.name} className="rounded-2xl bg-white/70 px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">{d.name}</div>
            <div className="text-xs text-slate-600">
              {d.specialty} • {d.hospital}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-600">
        Confidence:{' '}
        <span className="font-semibold">{Math.round(rec.confidence * 100)}%</span>
      </div>
    </div>
  )
}

