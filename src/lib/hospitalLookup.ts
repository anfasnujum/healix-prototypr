import type { Doctor, Hospital, ID } from '../types'

export function hospitalsById(hospitals: Hospital[]): Record<ID, Hospital> {
  return Object.fromEntries(hospitals.map((h) => [h.id, h]))
}

export function doctorHospitalName(
  doctor: Doctor | undefined,
  hospitals: Hospital[],
  byId?: Record<ID, Hospital>,
): string {
  if (!doctor) return '—'
  const map = byId ?? hospitalsById(hospitals)
  return map[doctor.hospitalId]?.name ?? 'Unknown hospital'
}
