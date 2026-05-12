import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { ZoneDropdown } from '../inputs/ZoneDropdown'
import { SymptomMultiSelect } from '../inputs/SymptomMultiSelect'
import { AIRecommendationCard } from '../AIRecommendationCard'
import type { AIRecommendation, Doctor, Symptom, Zone } from '../../types'
import { useHealixStore } from '../../store/useHealixStore'

function buildRecommendation(zone?: Zone, symptoms?: Symptom[]): AIRecommendation | undefined {
  if (!zone || !symptoms?.length) return undefined
  const hasChest = symptoms.includes('Chest Pain') || symptoms.includes('Palpitations')
  const hasBreath = symptoms.includes('Shortness of Breath')
  if (hasChest || hasBreath) {
    return {
      department: 'Cardiology',
      suggestedDoctors: [
        { name: 'Dr. Layla Al-Sulaimi', specialty: 'Interventional Cardiology', hospital: 'Healix Hospital Muscat' },
        { name: 'Dr. Omar Al-Hashmi', specialty: 'General Medicine', hospital: 'Healix Hospital Muscat' },
      ],
      confidence: 0.82,
    }
  }
  return {
    department: 'Internal Medicine',
    suggestedDoctors: [
      { name: 'Dr. Omar Al-Hashmi', specialty: 'General Medicine', hospital: 'Healix Hospital Muscat' },
      { name: 'Dr. Maha Al-Amri', specialty: 'Respiratory Medicine', hospital: 'Healix Hospital Muscat' },
    ],
    confidence: 0.66,
  }
}

type Slot = { id: string; label: string; dayLabel: string }

function makeWeekSlots(doctorId: string) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const baseId = `${doctorId}-${d.toISOString().slice(0, 10)}`
    const times = ['09:00', '10:30', '12:00', '14:00', '16:00']
    const available = times
      .filter((_, idx) => (i + idx) % 2 === 0)
      .map((t, idx) => ({
        id: `${baseId}-${idx}`,
        label: t,
        dayLabel,
      }))
    return { dayLabel, available }
  })
  return days
}

export function BookAppointmentModal({
  open,
  patientId,
  onClose,
}: {
  open: boolean
  patientId: string
  onClose: () => void
}) {
  const patient = useHealixStore((s) => s.patients.find((p) => p.id === patientId))
  const doctors = useHealixStore((s) => s.doctors)
  const conversations = useHealixStore((s) =>
    patientId ? s.conversationsByPatientId[patientId] ?? [] : [],
  )
  const bookAppointment = useHealixStore((s) => s.bookAppointment)

  const [zone, setZone] = useState<Zone | undefined>(patient?.zone)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [doctorQuery, setDoctorQuery] = useState('')
  const [doctorId, setDoctorId] = useState<string>('')
  const [slotId, setSlotId] = useState<string>('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [timePreset, setTimePreset] = useState<'morning_8_12' | 'afternoon_12_5' | 'evening_5_8'>('morning_8_12')

  const lastCall = useMemo(() => conversations[0], [conversations])

  useEffect(() => {
    if (!open) return
    setZone(lastCall?.caseForm.zone ?? patient?.zone)
    setSymptoms(lastCall?.caseForm.symptoms ?? [])
    setDoctorQuery('')
    setDoctorId('')
    setSlotId('')
    setDateStart('')
    setDateEnd('')
    setTimePreset('morning_8_12')
  }, [open, lastCall, patient?.zone])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const rec = useMemo(() => buildRecommendation(zone, symptoms), [zone, symptoms])

  const filteredDoctors = useMemo(() => {
    const q = doctorQuery.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter((d) =>
      [d.name, d.department, d.hospital].some((v) => v.toLowerCase().includes(q)),
    )
  }, [doctorQuery, doctors])

  const selectedDoctor: Doctor | undefined = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctors, doctorId],
  )

  const week = useMemo(() => (doctorId ? makeWeekSlots(doctorId) : []), [doctorId])

  if (!open || !patient) return null

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
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-slate-900">Book Appointment</div>
            <div className="mt-1 text-xs text-slate-500">
              Prefilled from the most recent call when available.
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-5">
            <div className="space-y-4">
              <ZoneDropdown label="Zone" value={zone} onChange={setZone} />
              <SymptomMultiSelect label="Symptoms" value={symptoms} onChange={setSymptoms} />

              {rec && zone && symptoms.length ? <AIRecommendationCard rec={rec} /> : null}

              <div className="healix-card p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Doctor Search</div>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    value={doctorQuery}
                    onChange={(e) => setDoctorQuery(e.target.value)}
                    placeholder="Search doctor, department, hospital…"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                  />
                </div>
                <div className="mt-3 max-h-48 overflow-auto rounded-2xl border border-gray-100">
                  {filteredDoctors.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={[
                        'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-gray-50',
                        doctorId === d.id ? 'bg-healix-teal/10' : '',
                      ].join(' ')}
                      onClick={() => {
                        setDoctorId(d.id)
                        setSlotId('')
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {d.name}{' '}
                          <span className="ml-2 text-xs font-semibold text-slate-500">
                            {d.department}
                          </span>
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {d.hospital} • {d.specialty}
                        </div>
                      </div>
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span
                          className={[
                            'h-2 w-2 rounded-full',
                            d.availableThisWeek ? 'bg-emerald-500' : 'bg-gray-300',
                          ].join(' ')}
                        />
                        {d.availableThisWeek ? 'Available' : 'Limited'}
                      </span>
                    </button>
                  ))}
                  {filteredDoctors.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-500">No matches.</div>
                  ) : null}
                </div>
              </div>

              {selectedDoctor ? (
                <div className="healix-card p-4">
                  <div className="mb-2 text-sm font-semibold text-slate-900">
                    Select Slot
                  </div>
                  <div className="space-y-3">
                    {week.map((d) => (
                      <div key={d.dayLabel}>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {d.dayLabel}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {d.available.map((s: Slot) => (
                            <button
                              key={s.id}
                              type="button"
                              className={[
                                'rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-200',
                                slotId === s.id
                                  ? 'border-healix-teal bg-healix-teal/10 text-healix-navy'
                                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50',
                              ].join(' ')}
                              onClick={() => setSlotId(s.id)}
                            >
                              {s.label}
                            </button>
                          ))}
                          {d.available.length === 0 ? (
                            <span className="text-xs text-slate-500">No slots</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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

          <div className="border-t border-gray-100 px-6 py-4">
            <Button
              fullWidth
              onClick={() => {
                if (!doctorId || !slotId) return
                const slot = week.flatMap((d) => d.available).find((s) => s.id === slotId)
                bookAppointment({
                  patientId,
                  clientId: patient.clientId,
                  doctorId,
                  slotId,
                  slotDateLabel: slot?.dayLabel,
                  slotTimeLabel: slot?.label,
                })
                onClose()
              }}
            >
              <CalendarCheck className="h-4 w-4" /> Confirm Booking
            </Button>
            {!doctorId || !slotId ? (
              <div className="mt-2 text-center text-xs text-slate-500">
                Select a doctor and slot to confirm.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

