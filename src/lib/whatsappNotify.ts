import { doctorHospitalName } from './hospitalLookup'
import type { Appointment, Doctor, Hospital, Patient } from '../types'

export function formatPhoneForWhatsApp(mobile: string) {
  const digits = mobile.replace(/\D/g, '')
  if (digits.startsWith('968')) return digits
  if (digits.length === 8) return `968${digits}`
  return digits
}

export function buildBookingWhatsAppMessage(
  patient: Patient,
  doctor: Doctor | undefined,
  appointment: Appointment | undefined,
  hospitals: Hospital[] = [],
) {
  const hospital = doctorHospitalName(doctor, hospitals)
  const doctorName = doctor?.name ?? '—'
  const date = appointment?.slotDateLabel ?? '—'
  const time = appointment?.slotTimeLabel ?? '—'

  return [
    `Hello ${patient.name},`,
    '',
    'Your appointment has been confirmed with Healix.',
    '',
    `Hospital: ${hospital}`,
    `Doctor: ${doctorName}`,
    `Date: ${date}`,
    `Time: ${time}`,
    '',
    'Thank you.',
  ].join('\n')
}

export function buildWhatsAppUrl(mobile: string, message: string) {
  const phone = formatPhoneForWhatsApp(mobile)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
