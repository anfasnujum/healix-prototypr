import { useMemo } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { useHealixStore } from '../store/useHealixStore'
import type { Appointment, TimelineEvent } from '../types'

const typeStyle: Record<
  TimelineEvent['type'],
  { label: string; dot: string }
> = {
  ai_call: { label: 'AI Call', dot: 'bg-purple-500' },
  cm_call: { label: 'Case Manager Call', dot: 'bg-healix-teal' },
  call_no_answer: { label: "Didn't Pick Up", dot: 'bg-rose-500' },
  appointment_booked: { label: 'Appointment Booked', dot: 'bg-blue-500' },
  appointment_cancelled: { label: 'Appointment Cancelled', dot: 'bg-rose-400' },
  appointment_rescheduled: { label: 'Appointment Rescheduled', dot: 'bg-indigo-500' },
  patient_whatsapp_notified: {
    label: 'WhatsApp Notification',
    dot: 'bg-emerald-500',
  },
  patient_added: { label: 'Patient Added', dot: 'bg-slate-400' },
  priority_changed: { label: 'Priority Changed', dot: 'bg-amber-500' },
  lead_dropped: { label: 'Lead Dropped', dot: 'bg-slate-500' },
}

function wasBookingNotifiedOnWhatsApp(
  events: TimelineEvent[],
  bookingEventId: string,
) {
  return events.some(
    (e) =>
      e.type === 'patient_whatsapp_notified' &&
      e.details?.relatedBookingEventId === bookingEventId,
  )
}

function resolveAppointmentForEvent(
  appointments: Appointment[],
  event: TimelineEvent,
  patientId: string,
) {
  const appointmentId = event.details?.appointmentId as string | undefined
  const doctorId = event.details?.doctorId as string | undefined
  const slotId = event.details?.slotId as string | undefined
  return (
    (appointmentId ? appointments.find((a) => a.id === appointmentId) : undefined) ??
    appointments.find(
      (a) =>
        a.patientId === patientId &&
        a.doctorId === doctorId &&
        a.slotId === slotId,
    )
  )
}

export function ActivityTimeline({
  events,
  patientId,
}: {
  events: TimelineEvent[]
  patientId: string
}) {
  const notifyPatientWhatsApp = useHealixStore((s) => s.notifyPatientWhatsApp)
  const appointments = useHealixStore((s) => s.appointments)

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [events],
  )

  return (
    <div className="healix-card px-6 py-6">
      <div className="space-y-5">
        {sortedEvents.map((e, idx) => {
          const s = typeStyle[e.type]
          const linkedAppointment = resolveAppointmentForEvent(
            appointments,
            e,
            patientId,
          )
          const showNotify =
            e.type === 'appointment_booked' &&
            linkedAppointment?.status !== 'cancelled' &&
            !wasBookingNotifiedOnWhatsApp(events, e.id)

          return (
            <div key={e.id} className="flex gap-4">
              <div className="w-28 shrink-0 pt-0.5 text-xs text-slate-500">
                <div>{new Date(e.at).toLocaleDateString()}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {new Date(e.at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="relative flex shrink-0 flex-col items-center">
                <div className={['h-2.5 w-2.5 rounded-full', s.dot].join(' ')} />
                {idx < sortedEvents.length - 1 ? (
                  <div className="mt-2 h-full w-px bg-gray-200" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {s.label}
                  </span>
                  <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{e.description}</div>
                {showNotify ? (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => notifyPatientWhatsApp(patientId, e.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Notify Patient
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}

        {sortedEvents.length === 0 ? (
          <div className="text-sm text-slate-500">No activity yet.</div>
        ) : null}
      </div>
    </div>
  )
}
