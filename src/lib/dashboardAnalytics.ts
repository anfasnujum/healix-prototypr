import { format, startOfDay, subDays } from 'date-fns'
import { doctorHospitalName, hospitalsById } from './hospitalLookup'
import type {
  Appointment,
  Client,
  Conversation,
  Doctor,
  Hospital,
  ID,
  Patient,
  TimelineEvent,
  Zone,
} from '../types'

export type DashboardPeriod = 7 | 30 | 90 | 'all'

export type DashboardFilters = {
  period: DashboardPeriod
  zone: Zone | 'all'
  clientId: ID | 'all'
}

export type NamedCount = { name: string; value: number }

export type WeeklyCallsRow = {
  weekLabel: string
  ai: number
  cm: number
  total: number
}

export type PartnerRow = {
  clientId: ID
  clientName: string
  active: boolean
  patients: number
  activePatients: number
  callsInPeriod: number
  bookedPatients: number
  navigatedPatients: number
  bookingRate: number
}

export type DashboardAnalytics = {
  rangeLabel: string
  periodStart: Date | null
  /** Patients matching zone/client filters (full cohort). */
  cohortPatients: Patient[]
  kpis: {
    totalPatients: number
    activePatients: number
    newRegistrationsInPeriod: number
    callsInPeriod: number
    aiCallsInPeriod: number
    cmCallsInPeriod: number
    aiSharePct: number
    avgCallDurationMinutes: number
    bookedPatientsEver: number
    navigatedPatientsEver: number
    bookingConversionPct: number
    urgentActiveUnbooked: number
    patientsTouchedInPeriod: number
  }
  zones: NamedCount[]
  priorities: NamedCount[]
  symptoms: NamedCount[]
  departments: NamedCount[]
  weeklyCalls: WeeklyCallsRow[]
  hospitals: NamedCount[]
  partnerRows: PartnerRow[]
  /** Demand from intake forms (caseForm.zone) in period, when present. */
  intakeZones: NamedCount[]
  doctorSupply: {
    hospital: string
    doctors: number
    availableThisWeek: number
  }[]
}

function periodStart(period: DashboardPeriod): Date | null {
  if (period === 'all') return null
  return startOfDay(subDays(new Date(), period))
}

function patientMatchesFilters(p: Patient, f: DashboardFilters): boolean {
  if (f.zone !== 'all' && p.zone !== f.zone) return false
  if (f.clientId !== 'all' && p.clientId !== f.clientId) return false
  return true
}

function inPeriod(iso: string, start: Date | null): boolean {
  if (!start) return true
  return new Date(iso).getTime() >= start.getTime()
}

export function patientHasBooking(
  patientId: ID,
  appointments: Appointment[],
  timelineByPatientId: Record<ID, TimelineEvent[]>,
): boolean {
  if (appointments.some((a) => a.patientId === patientId)) return true
  const evs = timelineByPatientId[patientId] ?? []
  return evs.some((e) => e.type === 'appointment_booked')
}

function weekKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const oneJan = new Date(y, 0, 1)
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

function bump(map: Map<string, number>, key: string, n = 1) {
  map.set(key, (map.get(key) ?? 0) + n)
}

export function computeDashboardAnalytics(
  patients: Patient[],
  clients: Client[],
  hospitals: Hospital[],
  doctors: Doctor[],
  appointments: Appointment[],
  conversationsByPatientId: Record<ID, Conversation[]>,
  timelineByPatientId: Record<ID, TimelineEvent[]>,
  filters: DashboardFilters,
): DashboardAnalytics {
  const start = periodStart(filters.period)
  const cohort = patients.filter((p) => patientMatchesFilters(p, filters))
  const cohortIds = new Set(cohort.map((p) => p.id))

  const allConversations = Object.values(conversationsByPatientId).flat()
  const conversationsInCohort = allConversations.filter((c) => cohortIds.has(c.patientId))
  const conversationsInPeriod = conversationsInCohort.filter((c) =>
    inPeriod(c.createdAt, start),
  )

  const rangeLabel =
    filters.period === 'all'
      ? 'All time'
      : `Last ${filters.period} days`

  const newRegistrationsInPeriod = cohort.filter((p) =>
    inPeriod(p.registrationDate, start),
  ).length

  let aiCalls = 0
  let cmCalls = 0
  let durationSum = 0
  const touchedInPeriod = new Set<ID>()
  const symptomMap = new Map<string, number>()
  const deptMap = new Map<string, number>()
  const intakeZoneMap = new Map<string, number>()
  const weekAgg = new Map<string, { ai: number; cm: number }>()

  for (const c of conversationsInPeriod) {
    touchedInPeriod.add(c.patientId)
    if (c.kind === 'ai') aiCalls += 1
    else cmCalls += 1
    durationSum += c.durationSeconds
    const wk = weekKey(c.createdAt)
    const cur = weekAgg.get(wk) ?? { ai: 0, cm: 0 }
    if (c.kind === 'ai') cur.ai += 1
    else cur.cm += 1
    weekAgg.set(wk, cur)

    for (const s of c.caseForm.symptoms ?? []) bump(symptomMap, s)
    const dept = c.caseForm.aiRecommendation?.department
    if (dept) bump(deptMap, dept)
    const p = patients.find((x) => x.id === c.patientId)
    const iz = c.caseForm.zone
    if (iz) bump(intakeZoneMap, iz)
    else if (p) bump(intakeZoneMap, p.zone)
  }

  const callsTotal = aiCalls + cmCalls
  const avgCallDurationMinutes =
    callsTotal > 0 ? durationSum / callsTotal / 60 : 0

  const zoneMap = new Map<string, number>()
  const priMap = new Map<string, number>()
  for (const p of cohort) {
    bump(zoneMap, p.zone)
    bump(priMap, p.priority)
  }

  const navigatedEver = new Set(
    conversationsInCohort.map((c) => c.patientId),
  )
  let bookedEver = 0
  for (const id of navigatedEver) {
    if (patientHasBooking(id, appointments, timelineByPatientId)) bookedEver += 1
  }

  const bookingConversionPct =
    navigatedEver.size > 0 ? Math.round((bookedEver / navigatedEver.size) * 1000) / 10 : 0

  const bookedPatientIds = new Set<ID>()
  for (const p of cohort) {
    if (patientHasBooking(p.id, appointments, timelineByPatientId))
      bookedPatientIds.add(p.id)
  }

  let urgentActiveUnbooked = 0
  for (const p of cohort) {
    if (p.stage === 'cold' || p.priority !== 'urgent') continue
    if (!patientHasBooking(p.id, appointments, timelineByPatientId))
      urgentActiveUnbooked += 1
  }

  const hospitalApptMap = new Map<string, number>()
  const doctorById = Object.fromEntries(doctors.map((d) => [d.id, d]))
  const hospitalMap = hospitalsById(hospitals)
  for (const a of appointments) {
    if (!cohortIds.has(a.patientId)) continue
    const doc = doctorById[a.doctorId]
    const h = doctorHospitalName(doc, hospitals, hospitalMap)
    bump(hospitalApptMap, h)
  }

  const partnerRows: PartnerRow[] = clients.map((cl) => {
    const cPatients = cohort.filter((p) => p.clientId === cl.id)
    const nav = new Set(
      conversationsInCohort.filter((c) => c.patientId && cPatients.some((p) => p.id === c.patientId)).map(
        (c) => c.patientId,
      ),
    )
    // Calls attributed to this client in period
    const callsHere = conversationsInPeriod.filter((c) => {
      const pat = patients.find((x) => x.id === c.patientId)
      return pat?.clientId === cl.id
    }).length
    let booked = 0
    for (const id of nav) {
      if (patientHasBooking(id, appointments, timelineByPatientId)) booked += 1
    }
    const bookingRate =
      nav.size > 0 ? Math.round((booked / nav.size) * 1000) / 10 : 0
    return {
      clientId: cl.id,
      clientName: cl.name,
      active: cl.status === 'active',
      patients: cPatients.length,
      activePatients: cPatients.filter((p) => p.stage !== 'cold').length,
      callsInPeriod: callsHere,
      bookedPatients: booked,
      navigatedPatients: nav.size,
      bookingRate,
    }
  }).filter((row) => row.patients > 0 || row.callsInPeriod > 0)

  const hospitalByDoctor = new Map<string, { doctors: number; avail: number }>()
  for (const d of doctors) {
    const hName = doctorHospitalName(d, hospitals, hospitalMap)
    const cur = hospitalByDoctor.get(hName) ?? { doctors: 0, avail: 0 }
    cur.doctors += 1
    if (d.availableThisWeek) cur.avail += 1
    hospitalByDoctor.set(hName, cur)
  }
  const doctorSupply = [...hospitalByDoctor.entries()].map(([hospital, v]) => ({
    hospital,
    doctors: v.doctors,
    availableThisWeek: v.avail,
  }))

  const sortedWeeks = [...weekAgg.keys()].sort()
  const weeklyCalls: WeeklyCallsRow[] = sortedWeeks.map((k) => {
    const v = weekAgg.get(k)!
    const y = Number(k.slice(0, 4))
    const wn = Number(k.slice(-2))
    const approx = new Date(y, 0, 1 + (wn - 1) * 7)
    return {
      weekLabel: format(approx, 'MMM d'),
      ai: v.ai,
      cm: v.cm,
      total: v.ai + v.cm,
    }
  })

  const toNamed = (m: Map<string, number>, limit = 12): NamedCount[] =>
    [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)

  return {
    rangeLabel,
    periodStart: start,
    cohortPatients: cohort,
    kpis: {
      totalPatients: cohort.length,
      activePatients: cohort.filter((p) => p.stage !== 'cold').length,
      newRegistrationsInPeriod,
      callsInPeriod: callsTotal,
      aiCallsInPeriod: aiCalls,
      cmCallsInPeriod: cmCalls,
      aiSharePct: callsTotal > 0 ? Math.round((aiCalls / callsTotal) * 1000) / 10 : 0,
      avgCallDurationMinutes,
      bookedPatientsEver: bookedPatientIds.size,
      navigatedPatientsEver: navigatedEver.size,
      bookingConversionPct,
      urgentActiveUnbooked,
      patientsTouchedInPeriod: touchedInPeriod.size,
    },
    zones: toNamed(zoneMap, 20),
    priorities: toNamed(priMap, 10),
    symptoms: toNamed(symptomMap, 12),
    departments: toNamed(deptMap, 12),
    weeklyCalls,
    hospitals: toNamed(hospitalApptMap, 10),
    partnerRows,
    intakeZones: toNamed(intakeZoneMap, 20),
    doctorSupply,
  }
}

export function formatMinutes(m: number): string {
  if (!m || Number.isNaN(m)) return '—'
  const rounded = Math.round(m * 10) / 10
  return `${rounded} min`
}
