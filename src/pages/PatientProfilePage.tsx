import {
  ArrowLeft,
  CalendarDays,
  CalendarClock,
  Phone,
  UserMinus,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { ConversationCard } from '../components/ConversationCard'
import { BookAppointmentModal } from '../components/modals/BookAppointmentModal'
import { CallModal } from '../components/modals/CallModal'
import { DropLeadModal } from '../components/modals/DropLeadModal'
import { Modal } from '../components/modals/Modal'
import { PriorityBadge } from '../components/PriorityBadge'
import { Button } from '../components/ui/Button'
import { describeAppointment, formatAppointmentWhen } from '../lib/appointmentSummary'
import { doctorHospitalName } from '../lib/hospitalLookup'
import {
  EMPTY_CONVERSATIONS,
  EMPTY_TIMELINE_EVENTS,
  useHealixStore,
} from '../store/useHealixStore'

export function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const patient = useHealixStore((s) => s.patients.find((p) => p.id === id))
  const client = useHealixStore((s) => {
    const p = s.patients.find((pt) => pt.id === id)
    return p ? s.clients.find((c) => c.id === p.clientId) : undefined
  })
  const convos = useHealixStore((s) =>
    id ? (s.conversationsByPatientId[id] ?? EMPTY_CONVERSATIONS) : EMPTY_CONVERSATIONS,
  )
  const events = useHealixStore((s) =>
    id ? (s.timelineByPatientId[id] ?? EMPTY_TIMELINE_EVENTS) : EMPTY_TIMELINE_EVENTS,
  )
  const appointments = useHealixStore((s) => s.appointments)
  const hospitals = useHealixStore((s) => s.hospitals)
  const doctors = useHealixStore((s) => s.doctors)

  const [tab, setTab] = useState<'overview' | 'conversations' | 'bookings'>('overview')
  const [convFilter, setConvFilter] = useState<'all' | 'ai' | 'cm'>('all')
  const [callOpen, setCallOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | undefined>()
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | undefined>()
  const [dropLeadOpen, setDropLeadOpen] = useState(false)

  const cancelAppointment = useHealixStore((s) => s.cancelAppointment)
  const dropLead = useHealixStore((s) => s.dropLead)

  const lastAI = useMemo(() => convos.find((c) => c.kind === 'ai'), [convos])
  const filteredConvos = useMemo(() => {
    if (convFilter === 'all') return convos
    return convos.filter((c) => c.kind === convFilter)
  }, [convos, convFilter])

  const patientBookings = useMemo(() => {
    if (!id) return []
    return appointments
      .filter((a) => a.patientId === id && a.status !== 'cancelled')
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [appointments, id])

  const cancelTarget = useMemo(() => {
    if (!cancelAppointmentId) return undefined
    const appt = appointments.find((a) => a.id === cancelAppointmentId)
    if (!appt) return undefined
    const doctor = doctors.find((d) => d.id === appt.doctorId)
    return { appt, doctor }
  }, [cancelAppointmentId, appointments, doctors, hospitals])

  if (!patient) {
    return (
      <div className="healix-card px-6 py-5">
        <div className="font-display text-2xl font-semibold text-slate-900">
          Patient not found
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Go back to{' '}
          <Link className="text-healix-teal hover:underline" to="/bench">
            Bench
          </Link>
          .
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="healix-card px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="mt-0.5 rounded-xl border border-gray-200 bg-white p-2 text-slate-700 transition-all duration-200 hover:bg-gray-50"
              onClick={() => navigate('/bench')}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-healix-teal/10 text-sm font-semibold text-healix-navy">
                {patient.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('')}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                    {patient.name}
                  </div>
                  <PriorityBadge level={patient.priority} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">
                    {patient.registrationId}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>{patient.mobile}</span>
                  {client ? (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {client.name}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => setCallOpen(true)}>
              <Phone className="h-4 w-4" /> Start Call
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleAppointmentId(undefined)
                setBookOpen(true)
              }}
            >
              <CalendarDays className="h-4 w-4" /> Book Appointment
            </Button>
            <Button variant="danger" onClick={() => setDropLeadOpen(true)}>
              <UserMinus className="h-4 w-4" /> Drop Lead
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={[
            'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
            tab === 'overview'
              ? 'bg-healix-teal/15 text-healix-navy'
              : 'bg-white text-slate-700 hover:bg-gray-50',
          ].join(' ')}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={[
            'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
            tab === 'conversations'
              ? 'bg-healix-teal/15 text-healix-navy'
              : 'bg-white text-slate-700 hover:bg-gray-50',
          ].join(' ')}
          onClick={() => setTab('conversations')}
        >
          Conversations
        </button>
        <button
          type="button"
          className={[
            'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
            tab === 'bookings'
              ? 'bg-healix-teal/15 text-healix-navy'
              : 'bg-white text-slate-700 hover:bg-gray-50',
          ].join(' ')}
          onClick={() => setTab('bookings')}
        >
          Bookings
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="healix-card px-6 py-6 xl:col-span-2">
              <div className="text-sm font-semibold text-slate-900">Patient Details</div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zone
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {patient.zone}
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned Client
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {client?.name ?? '—'}
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registration Date
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(patient.registrationDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Contact
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(patient.lastContactAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">Notes</div>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
                  defaultValue={patient.notes ?? ''}
                  placeholder="Add internal notes…"
                />
              </div>
            </div>

            <div className="healix-card px-6 py-6">
              <div className="text-sm font-semibold text-slate-900">
                Last AI Intake Summary
              </div>
              {lastAI ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Purpose of call
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      Intake & symptom capture
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Key info collected
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{lastAI.summary}</div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      AI-assigned priority
                    </div>
                    <PriorityBadge level={lastAI.priorityAfter} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(lastAI.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">
                  No AI intake recorded yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-slate-900">Activity Log</div>
            <ActivityTimeline events={events} patientId={patient.id} />
          </div>
        </div>
      ) : null}

      {tab === 'conversations' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All'],
                ['ai', 'AI Calls'],
                ['cm', 'Case Manager Calls'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                  convFilter === k
                    ? 'bg-healix-teal/15 text-healix-navy'
                    : 'bg-white text-slate-700 hover:bg-gray-50',
                ].join(' ')}
                onClick={() => setConvFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredConvos.map((c) => (
              <ConversationCard key={c.id} conversation={c} />
            ))}
            {filteredConvos.length === 0 ? (
              <div className="healix-card px-6 py-6 text-sm text-slate-600">
                No conversations in this category yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'bookings' ? (
        <div className="space-y-3">
          {patientBookings.map((b) => {
            const doctor = doctors.find((d) => d.id === b.doctorId)
            const appointmentWhen = formatAppointmentWhen(b)
            return (
              <div
                key={b.id}
                className="healix-card flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-healix-teal/10 text-healix-navy">
                    <CalendarDays className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {doctor?.name ?? 'Unknown doctor'}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {[doctor?.department, doctorHospitalName(doctor, hospitals)]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{appointmentWhen}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Booked {new Date(b.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleAppointmentId(b.id)
                      setBookOpen(true)
                    }}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Reschedule
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancelAppointmentId(b.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )
          })}
          {patientBookings.length === 0 ? (
            <div className="healix-card px-6 py-6 text-sm text-slate-600">
              No bookings yet. Use{' '}
              <span className="font-semibold text-slate-800">Book Appointment</span> above to add
              one; it will appear here as soon as it is confirmed.
            </div>
          ) : null}
        </div>
      ) : null}

      <CallModal
        open={callOpen}
        patientId={patient.id}
        onClose={() => setCallOpen(false)}
      />

      <BookAppointmentModal
        open={bookOpen}
        patientId={patient.id}
        rescheduleAppointmentId={rescheduleAppointmentId}
        onClose={() => {
          setBookOpen(false)
          setRescheduleAppointmentId(undefined)
        }}
      />

      <DropLeadModal
        open={dropLeadOpen}
        patientName={patient.name}
        onClose={() => setDropLeadOpen(false)}
        onConfirm={(reason) => {
          dropLead(patient.id, reason)
          setDropLeadOpen(false)
        }}
      />

      <Modal
        open={Boolean(cancelTarget)}
        title="Cancel appointment?"
        description="The patient will no longer have this slot reserved. This will be recorded in the activity log."
        onClose={() => setCancelAppointmentId(undefined)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelAppointmentId(undefined)}>
              Keep appointment
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (cancelAppointmentId) cancelAppointment(cancelAppointmentId)
                setCancelAppointmentId(undefined)
              }}
            >
              Cancel appointment
            </Button>
          </div>
        }
      >
        {cancelTarget ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">
              {cancelTarget.doctor?.name ?? 'Unknown doctor'}
            </div>
            <div className="mt-1">
              {describeAppointment(cancelTarget.doctor, cancelTarget.appt, hospitals) ||
                formatAppointmentWhen(cancelTarget.appt)}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

