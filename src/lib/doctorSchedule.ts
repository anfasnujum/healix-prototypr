import type { DoctorWeeklySchedule, ID, PreferredTimeSlot, Weekday } from '../types'
import { THIRTY_MIN_SLOTS } from './timeSlots'

export type BookableSlot = {
  id: string
  label: string
  dayLabel: string
  date: string
}

export type BookableDay = {
  dayLabel: string
  date: string
  weekday: Weekday
  available: BookableSlot[]
}

export const WEEKDAY_ROWS: { weekday: Weekday; label: string }[] = [
  { weekday: 1, label: 'Monday' },
  { weekday: 2, label: 'Tuesday' },
  { weekday: 3, label: 'Wednesday' },
  { weekday: 4, label: 'Thursday' },
  { weekday: 5, label: 'Friday' },
  { weekday: 6, label: 'Saturday' },
  { weekday: 0, label: 'Sunday' },
]

const DEFAULT_WEEKDAY_SLOTS: PreferredTimeSlot[] = [
  '09:00–09:30',
  '10:00–10:30',
  '11:00–11:30',
  '14:00–14:30',
  '15:00–15:30',
  '16:00–16:30',
]

export function defaultWeeklySchedule(doctorId: ID): DoctorWeeklySchedule {
  const slotsByWeekday: DoctorWeeklySchedule['slotsByWeekday'] = {}
  for (const { weekday } of WEEKDAY_ROWS) {
    if (weekday >= 1 && weekday <= 5) {
      slotsByWeekday[weekday] = [...DEFAULT_WEEKDAY_SLOTS]
    }
  }
  return { doctorId, slotsByWeekday }
}

export function emptyWeeklySchedule(doctorId: ID): DoctorWeeklySchedule {
  return { doctorId, slotsByWeekday: {} }
}

export function hasBookableSlotsThisWeek(
  schedule: DoctorWeeklySchedule | undefined,
  doctorId: ID,
): boolean {
  return buildBookableWeek(doctorId, schedule).some((d) => d.available.length > 0)
}

export function buildBookableWeek(
  doctorId: ID,
  schedule: DoctorWeeklySchedule | undefined,
): BookableDay[] {
  const days: BookableDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + i)
    const weekday = d.getDay() as Weekday
    const date = d.toISOString().slice(0, 10)
    const dayLabel = d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const templateSlots = schedule?.slotsByWeekday[weekday] ?? []
    const available = templateSlots.map((label, idx) => ({
      id: `${doctorId}-${date}-${idx}`,
      label,
      dayLabel,
      date,
    }))
    days.push({ dayLabel, date, weekday, available })
  }
  return days
}

export function countSlotsInSchedule(schedule: DoctorWeeklySchedule | undefined): number {
  if (!schedule) return 0
  return Object.values(schedule.slotsByWeekday).reduce(
    (sum, slots) => sum + (slots?.length ?? 0),
    0,
  )
}

export { THIRTY_MIN_SLOTS }
