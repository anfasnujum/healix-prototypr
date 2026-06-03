import { doctorHospitalName } from './hospitalLookup'
import type { Appointment, Doctor, Hospital } from '../types'

export function formatAppointmentWhen(appointment: Appointment) {
  const parts = [appointment.slotDateLabel, appointment.slotTimeLabel].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  const m = appointment.slotId.match(/(\d{4}-\d{2}-\d{2})/)
  if (m) {
    return new Date(`${m[1]}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
  return '—'
}

export function describeAppointment(
  doctor: Doctor | undefined,
  appointment: Appointment,
  hospitals: Hospital[] = [],
) {
  const when = formatAppointmentWhen(appointment)
  return [
    doctor?.name,
    doctor ? doctorHospitalName(doctor, hospitals) : undefined,
    when !== '—' ? when : undefined,
  ]
    .filter(Boolean)
    .join(' — ')
}
