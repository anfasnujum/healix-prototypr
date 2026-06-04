import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { CallPreferencesDisplay } from '../CallPreferencesDisplay'
import { doctorHospitalName } from '../../lib/hospitalLookup'
import type { Doctor } from '../../types'
import { EMPTY_CONVERSATIONS, useHealixStore } from '../../store/useHealixStore'

function formatDateLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeLabel(time: string) {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

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

  const [hospitalId, setHospitalId] = useState('')
  const [doctorQuery, setDoctorQuery] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')

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
      const dateMatch = replacingAppointment.slotId.match(/(\d{4}-\d{2}-\d{2})/)
      setAppointmentDate(dateMatch?.[1] ?? '')
      const timeMatch = replacingAppointment.slotTimeLabel?.match(/(\d{1,2}:\d{2})/)
      setAppointmentTime(timeMatch?.[1] ?? '')
    } else {
      setHospitalId('')
      setDoctorQuery('')
      setDoctorId('')
      setAppointmentDate('')
      setAppointmentTime('')
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

  const canConfirm = Boolean(doctorId && appointmentDate && appointmentTime)

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
      <div className="flex h-[80vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-soft">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="text-sm font-semibold text-slate-900">
            {rescheduleAppointmentId ? 'Reschedule Appointment' : 'Book Appointment'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {rescheduleAppointmentId
              ? 'Choose a new hospital, doctor, and appointment time. The previous booking will be cancelled.'
              : 'Call preferences stay on the left. Choose hospital, doctor, date, and time on the right to confirm.'}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="w-[300px] shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/40 px-5 py-5">
            <CallPreferencesDisplay
              zone={callForm?.zone}
              symptoms={callForm?.symptoms}
              dates={preferredDates}
              timeSlots={preferredTimeSlots}
            />
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-800">Hospital</div>
              <select
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                value={hospitalId}
                onChange={(e) => {
                  setHospitalId(e.target.value)
                  setDoctorId('')
                  setAppointmentDate('')
                  setAppointmentTime('')
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
                          setAppointmentDate('')
                          setAppointmentTime('')
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
              <div className="healix-card p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Appointment time</div>
                <p className="mb-3 text-xs text-slate-500">
                  {selectedDoctor.name} · {selectedDoctor.department}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 text-sm font-medium text-slate-800">Date</div>
                    <input
                      type="date"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-sm font-medium text-slate-800">Time</div>
                    <input
                      type="time"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <Button
            fullWidth
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return
              const doctor = doctors.find((d) => d.id === doctorId)
              const slotDateLabel = formatDateLabel(appointmentDate)
              const slotTimeLabel = formatTimeLabel(appointmentTime)
              const slotId = `${doctorId}-${appointmentDate}-${appointmentTime}`
              const payload = {
                patientId,
                clientId: patient.clientId,
                doctorId,
                slotId,
                slotDateLabel,
                slotTimeLabel,
                notes: [
                  doctor?.name,
                  doctorHospitalName(doctor, hospitals),
                  slotDateLabel,
                  slotTimeLabel,
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
          {!canConfirm ? (
            <div className="mt-2 text-center text-xs text-slate-500">
              Select a hospital, doctor, date, and time to confirm.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
