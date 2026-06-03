import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarCheck, Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { CallPreferencesDisplay } from '../CallPreferencesDisplay'
import { buildBookableWeek, hasBookableSlotsThisWeek } from '../../lib/doctorSchedule'
import { doctorHospitalName } from '../../lib/hospitalLookup'
import type { Doctor } from '../../types'
import { EMPTY_CONVERSATIONS, useHealixStore } from '../../store/useHealixStore'

export function BookAppointmentModal({
  open,
  patientId,
  onClose,
  rescheduleAppointmentId,
}: {
  open: boolean
  patientId: string
  onClose: () => void
  rescheduleAppointmentId?: string
}) {
  const patient = useHealixStore((s) => s.patients.find((p) => p.id === patientId))
  const hospitals = useHealixStore((s) => s.hospitals)
  const doctors = useHealixStore((s) => s.doctors)
  const doctorSchedulesByDoctorId = useHealixStore((s) => s.doctorSchedulesByDoctorId)
  const appointments = useHealixStore((s) => s.appointments)
  const conversations = useHealixStore((s) =>
    patientId
      ? (s.conversationsByPatientId[patientId] ?? EMPTY_CONVERSATIONS)
      : EMPTY_CONVERSATIONS,
  )
  const bookAppointment = useHealixStore((s) => s.bookAppointment)
  const rescheduleAppointment = useHealixStore((s) => s.rescheduleAppointment)

  const replacingAppointment = useMemo(
    () =>
      rescheduleAppointmentId
        ? appointments.find((a) => a.id === rescheduleAppointmentId)
        : undefined,
    [appointments, rescheduleAppointmentId],
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const slotsSectionRef = useRef<HTMLDivElement>(null)

  const [hospitalId, setHospitalId] = useState('')
  const [doctorQuery, setDoctorQuery] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [slotId, setSlotId] = useState('')

  const lastCall = useMemo(
    () => conversations.find((c) => c.kind === 'cm') ?? conversations[0],
    [conversations],
  )

  const callForm = lastCall?.caseForm
  const preferredDates = callForm?.preferredDates
  const preferredTimeSlots = callForm?.preferredTimeSlots

  useEffect(() => {
    if (!open) return
    if (replacingAppointment) {
      const doctor = doctors.find((d) => d.id === replacingAppointment.doctorId)
      setHospitalId(doctor?.hospitalId ?? '')
      setDoctorId(replacingAppointment.doctorId)
      setDoctorQuery('')
      setSlotId('')
    } else {
      setHospitalId('')
      setDoctorQuery('')
      setDoctorId('')
      setSlotId('')
    }
  }, [open, patientId, replacingAppointment, doctors])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!doctorId || !slotsSectionRef.current || !scrollRef.current) return
    const frame = window.requestAnimationFrame(() => {
      slotsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [doctorId])

  const doctorsAtHospital = useMemo(
    () => (hospitalId ? doctors.filter((d) => d.hospitalId === hospitalId) : []),
    [doctors, hospitalId],
  )

  const filteredDoctors = useMemo(() => {
    const q = doctorQuery.trim().toLowerCase()
    if (!q) return doctorsAtHospital
    return doctorsAtHospital.filter((d) =>
      [d.name, d.department, d.specialty].some((v) => v.toLowerCase().includes(q)),
    )
  }, [doctorQuery, doctorsAtHospital])

  const selectedDoctor: Doctor | undefined = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctors, doctorId],
  )

  const week = useMemo(
    () =>
      doctorId
        ? buildBookableWeek(doctorId, doctorSchedulesByDoctorId[doctorId])
        : [],
    [doctorId, doctorSchedulesByDoctorId],
  )

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
      <div className="flex h-[80vh] w-full max-w-[700px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-soft">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="text-sm font-semibold text-slate-900">
            {rescheduleAppointmentId ? 'Reschedule Appointment' : 'Book Appointment'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {rescheduleAppointmentId
              ? 'Choose a new hospital, doctor, and slot. The previous booking will be cancelled.'
              : 'Preferences from the latest call are shown below. Choose hospital, doctor, and slot to confirm.'}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <CallPreferencesDisplay
              zone={callForm?.zone}
              symptoms={callForm?.symptoms}
              dates={preferredDates}
              timeSlots={preferredTimeSlots}
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-800">Hospital</div>
              <select
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                value={hospitalId}
                onChange={(e) => {
                  setHospitalId(e.target.value)
                  setDoctorId('')
                  setSlotId('')
                  setDoctorQuery('')
                }}
              >
                <option value="">Select a hospital…</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={[
                'healix-card p-4 transition-opacity duration-200',
                hospitalId ? 'opacity-100' : 'pointer-events-none opacity-50',
              ].join(' ')}
            >
              <div className="mb-2 text-sm font-semibold text-slate-900">Doctor Search</div>
              {!hospitalId ? (
                <p className="text-sm text-slate-500">Select a hospital to search doctors.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      value={doctorQuery}
                      onChange={(e) => setDoctorQuery(e.target.value)}
                      placeholder="Search doctor, department, or specialty…"
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
                          <div className="truncate text-xs text-slate-500">{d.specialty}</div>
                        </div>
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span
                            className={[
                              'h-2 w-2 rounded-full',
                              hasBookableSlotsThisWeek(
                                doctorSchedulesByDoctorId[d.id],
                                d.id,
                              )
                                ? 'bg-emerald-500'
                                : 'bg-gray-300',
                            ].join(' ')}
                          />
                          {hasBookableSlotsThisWeek(doctorSchedulesByDoctorId[d.id], d.id)
                            ? 'Available'
                            : 'No slots'}
                        </span>
                      </button>
                    ))}
                    {filteredDoctors.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-500">No matches.</div>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {selectedDoctor ? (
              <div ref={slotsSectionRef} className="healix-card scroll-mt-4 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Select Slot</div>
                <p className="mb-3 text-xs text-slate-500">
                  {selectedDoctor.name} · {selectedDoctor.department}
                </p>
                <div className="space-y-3">
                  {week.map((d) => (
                    <div key={d.dayLabel}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {d.dayLabel}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.available.map((s) => (
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
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <Button
            fullWidth
            disabled={!doctorId || !slotId}
            onClick={() => {
              if (!doctorId || !slotId) return
              const slot = week.flatMap((d) => d.available).find((s) => s.id === slotId)
              const doctor = doctors.find((d) => d.id === doctorId)
              const payload = {
                patientId,
                clientId: patient.clientId,
                doctorId,
                slotId,
                slotDateLabel: slot?.dayLabel,
                slotTimeLabel: slot?.label,
                notes: [
                  doctor?.name,
                  doctorHospitalName(doctor, hospitals),
                  slot?.dayLabel,
                  slot?.label,
                ]
                  .filter(Boolean)
                  .join(' · '),
              }
              if (rescheduleAppointmentId) {
                rescheduleAppointment(rescheduleAppointmentId, payload)
              } else {
                bookAppointment(payload)
              }
              onClose()
            }}
          >
            <CalendarCheck className="h-4 w-4" />
            {rescheduleAppointmentId ? 'Confirm Reschedule' : 'Confirm Booking'}
          </Button>
          {!doctorId || !slotId ? (
            <div className="mt-2 text-center text-xs text-slate-500">
              Select a hospital, doctor, and slot to confirm.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
