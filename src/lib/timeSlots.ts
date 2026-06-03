import type { PreferredTimeSlot } from '../types'

/** 30-minute slots from 08:00 through 19:30 (last slot ends 20:00). */
export const THIRTY_MIN_SLOTS: PreferredTimeSlot[] = (() => {
  const slots: PreferredTimeSlot[] = []
  for (let minutes = 8 * 60; minutes < 20 * 60; minutes += 30) {
    const startH = Math.floor(minutes / 60)
    const startM = minutes % 60
    const endMinutes = minutes + 30
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    const start = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    slots.push(`${start}–${end}`)
  }
  return slots
})()
