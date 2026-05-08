import { useEffect, useMemo, useState } from 'react'
import { PhoneOff } from 'lucide-react'
import { Button } from '../ui/Button'
import { ZoneDropdown } from '../inputs/ZoneDropdown'
import { SymptomMultiSelect } from '../inputs/SymptomMultiSelect'
import { AIRecommendationCard } from '../AIRecommendationCard'
import type { AIRecommendation, Symptom, Zone } from '../../types'
import { useHealixStore } from '../../store/useHealixStore'

const mockTranscript = [
  { speaker: 'case_manager' as const, text: 'Hello, this is Healix. How are you feeling today?' },
  { speaker: 'patient' as const, text: 'Not great — I’ve had headaches and fatigue.' },
  { speaker: 'case_manager' as const, text: 'Understood. Any fever or dizziness?' },
  { speaker: 'patient' as const, text: 'Some dizziness, no fever.' },
]

function buildRecommendation(zone?: Zone, symptoms?: Symptom[]): AIRecommendation | undefined {
  if (!zone || !symptoms?.length) return undefined
  const hasChest = symptoms.includes('Chest Pain') || symptoms.includes('Palpitations')
  const hasBreath = symptoms.includes('Shortness of Breath')
  const hasHead = symptoms.includes('Headache') || symptoms.includes('Dizziness')
  if (hasChest || hasBreath) {
    return {
      department: 'Cardiology',
      suggestedDoctors: [
        { name: 'Dr. Layla Al-Sulaimi', specialty: 'Interventional Cardiology', hospital: 'Healix Hospital Muscat' },
        { name: 'Dr. Omar Al-Hashmi', specialty: 'General Medicine', hospital: 'Healix Hospital Muscat' },
      ],
      confidence: 0.84,
    }
  }
  if (hasHead) {
    return {
      department: 'Neurology',
      suggestedDoctors: [
        { name: 'Dr. Sara Al-Mahrooqi', specialty: 'Headache & Migraine', hospital: 'Healix Specialty Center' },
        { name: 'Dr. Omar Al-Hashmi', specialty: 'Internal Medicine', hospital: 'Healix Hospital Muscat' },
      ],
      confidence: 0.72,
    }
  }
  return {
    department: 'Internal Medicine',
    suggestedDoctors: [
      { name: 'Dr. Omar Al-Hashmi', specialty: 'General Medicine', hospital: 'Healix Hospital Muscat' },
      { name: 'Dr. Maha Al-Amri', specialty: 'Respiratory Medicine', hospital: 'Healix Hospital Muscat' },
    ],
    confidence: 0.63,
  }
}

export function CallModal({
  open,
  patientId,
  onClose,
}: {
  open: boolean
  patientId: string
  onClose: () => void
}) {
  const addConversation = useHealixStore((s) => s.addConversation)
  const patient = useHealixStore((s) => s.patients.find((p) => p.id === patientId))

  const [seconds, setSeconds] = useState(0)
  const [zone, setZone] = useState<Zone | undefined>(patient?.zone)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [timePreset, setTimePreset] = useState<'morning_8_12' | 'afternoon_12_5' | 'evening_5_8'>('morning_8_12')

  const rec = useMemo(() => buildRecommendation(zone, symptoms), [zone, symptoms])

  useEffect(() => {
    if (!open) return
    setSeconds(0)
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !patient) return null

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-healix-navy/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="h-[80vh] w-full max-w-[700px] overflow-hidden rounded-2xl border border-white/10 bg-white shadow-soft">
        <div className="grid h-full grid-cols-1 lg:grid-cols-2">
          <div className="flex h-full flex-col border-b border-gray-100 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Live Call</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-rose-500">
                    <span className="h-2 w-2 animate-ping rounded-full bg-rose-500/50" />
                  </span>
                  {mm}:{ss}
                </div>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {patient.registrationId}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-healix-surface px-4 py-4">
              <div className="space-y-2">
                {mockTranscript.map((t, idx) => {
                  const right = t.speaker === 'case_manager'
                  return (
                    <div key={idx} className={['flex', right ? 'justify-end' : 'justify-start'].join(' ')}>
                      <div
                        className={[
                          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          right
                            ? 'bg-healix-teal text-healix-navy'
                            : 'bg-gray-100 text-slate-900',
                        ].join(' ')}
                      >
                        {t.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-5 py-4">
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const createdAt = new Date().toISOString()
                  addConversation({
                    patientId,
                    kind: 'cm',
                    title: 'Case Manager Call',
                    createdAt,
                    durationSeconds: seconds,
                    summary: `Case manager call saved. Zone: ${zone ?? '—'}. Symptoms: ${symptoms.join(', ') || '—'}.`,
                    priorityAfter: patient.priority,
                    transcript: mockTranscript.map((t, i) => ({
                      id: `t-${createdAt}-${i}`,
                      speaker: t.speaker,
                      text: t.text,
                      at: createdAt,
                    })),
                    caseForm: {
                      zone,
                      symptoms,
                      preferredDateRange:
                        dateStart && dateEnd ? { start: new Date(dateStart).toISOString(), end: new Date(dateEnd).toISOString() } : undefined,
                      preferredTimeRange: { preset: timePreset },
                      aiRecommendation: rec,
                    },
                  })
                  onClose()
                }}
              >
                <PhoneOff className="h-4 w-4" /> End Call
              </Button>
            </div>
          </div>

          <div className="flex h-full flex-col">
            <div className="px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Case Form</div>
              <div className="mt-1 text-xs text-slate-500">
                Capture key info during the call.
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 pb-5">
              <div className="space-y-4">
                <ZoneDropdown label="Zone" value={zone} onChange={setZone} />
                <SymptomMultiSelect label="Symptoms" value={symptoms} onChange={setSymptoms} />

                {rec && zone && symptoms.length ? <AIRecommendationCard rec={rec} /> : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 text-sm font-medium text-slate-800">
                      Preferred Date (Start)
                    </div>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-sm font-medium text-slate-800">
                      Preferred Date (End)
                    </div>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    Preferred Time Range
                  </div>
                  <select
                    value={timePreset}
                    onChange={(e) =>
                      setTimePreset(
                        e.target.value as 'morning_8_12' | 'afternoon_12_5' | 'evening_5_8',
                      )
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                  >
                    <option value="morning_8_12">Morning 8–12</option>
                    <option value="afternoon_12_5">Afternoon 12–5</option>
                    <option value="evening_5_8">Evening 5–8</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  // Stored on end call (per spec). Keep button as explicit “Save”.
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

