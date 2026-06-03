import { useEffect, useState } from 'react'
import { PhoneMissed, PhoneOff } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ZoneDropdown } from '../inputs/ZoneDropdown'
import { SymptomMultiSelect } from '../inputs/SymptomMultiSelect'
import { DateMultiPicker } from '../inputs/DateMultiPicker'
import { TimeSlotMultiSelect } from '../inputs/TimeSlotMultiSelect'
import type { PreferredDate, PreferredTimeSlot, Symptom, Zone } from '../../types'
import { useHealixStore } from '../../store/useHealixStore'

const mockTranscript = [
  { speaker: 'case_manager' as const, text: 'Hello, this is Healix. How are you feeling today?' },
  { speaker: 'patient' as const, text: "Not great — I've had headaches and fatigue." },
  { speaker: 'case_manager' as const, text: 'Understood. Any fever or dizziness?' },
  { speaker: 'patient' as const, text: 'Some dizziness, no fever.' },
]

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
  const recordCallNoAnswer = useHealixStore((s) => s.recordCallNoAnswer)
  const patient = useHealixStore((s) => s.patients.find((p) => p.id === patientId))

  const [seconds, setSeconds] = useState(0)
  const [location, setLocation] = useState('')
  const [zone, setZone] = useState<Zone | undefined>(patient?.zone)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [preferredDates, setPreferredDates] = useState<PreferredDate[]>([])
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<PreferredTimeSlot[]>([])

  useEffect(() => {
    if (!open) return
    setSeconds(0)
    setLocation('')
    setZone(patient?.zone)
    setSymptoms([])
    setPreferredDates([])
    setPreferredTimeSlots([])
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [open, patient?.zone])

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

  const handleEndCall = () => {
    const createdAt = new Date().toISOString()
    const dateSummary = preferredDates.length ? preferredDates.join(', ') : '—'
    const slotSummary = preferredTimeSlots.length ? preferredTimeSlots.join(', ') : '—'
    addConversation({
      patientId,
      kind: 'cm',
      title: 'Case Manager Call',
      createdAt,
      durationSeconds: seconds,
      summary: `Case manager call saved. Location: ${location.trim() || '—'}. Zone: ${zone ?? '—'}. Symptoms: ${symptoms.join(', ') || '—'}. Dates: ${dateSummary}. Times: ${slotSummary}.`,
      priorityAfter: patient.priority,
      transcript: mockTranscript.map((t, i) => ({
        id: `t-${createdAt}-${i}`,
        speaker: t.speaker,
        text: t.text,
        at: createdAt,
      })),
      caseForm: {
        location: location.trim() || undefined,
        zone,
        symptoms,
        preferredDates: preferredDates.length ? preferredDates : undefined,
        preferredTimeSlots: preferredTimeSlots.length ? preferredTimeSlots : undefined,
      },
    })
    onClose()
  }

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
                <Input
                  label="Location"
                  placeholder="Address, landmark, or area…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <ZoneDropdown label="Zone" value={zone} onChange={setZone} />
                <SymptomMultiSelect label="Symptoms" value={symptoms} onChange={setSymptoms} />

                <DateMultiPicker
                  label="Preferred Dates"
                  value={preferredDates}
                  onChange={setPreferredDates}
                />

                <TimeSlotMultiSelect
                  label="Preferred Time Range"
                  value={preferredTimeSlots}
                  onChange={setPreferredTimeSlots}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    recordCallNoAnswer(patientId)
                    onClose()
                  }}
                >
                  <PhoneMissed className="h-4 w-4" /> Didn&apos;t Pick Up
                </Button>
                <Button variant="success" fullWidth onClick={handleEndCall}>
                  <PhoneOff className="h-4 w-4" /> End Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
