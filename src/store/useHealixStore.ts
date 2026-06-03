import { create } from 'zustand'
import type {
  Appointment,
  AppointmentSlot,
  BenchEntry,
  Client,
  Conversation,
  Doctor,
  DoctorWeeklySchedule,
  Hospital,
  PatientStage,
  Patient,
  TimelineEvent,
  ID,
  PriorityLevel,
} from '../types'
import { describeAppointment } from '../lib/appointmentSummary'
import {
  defaultWeeklySchedule,
  hasBookableSlotsThisWeek,
} from '../lib/doctorSchedule'
import { doctorHospitalName } from '../lib/hospitalLookup'
import {
  buildBookingWhatsAppMessage,
  buildWhatsAppUrl,
} from '../lib/whatsappNotify'
import {
  clientsSeed,
  conversationsSeed,
  doctorSchedulesSeed,
  doctorsSeed,
  hospitalsSeed,
  patientsSeed,
  timelineSeed,
} from '../mock/seed'

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`

/** Stable fallbacks for Zustand selectors — never use `?? []` inline in selectors. */
export const EMPTY_CONVERSATIONS: Conversation[] = []
export const EMPTY_TIMELINE_EVENTS: TimelineEvent[] = []

export type HealixState = {
  clients: Client[]
  patients: Patient[]
  hospitals: Hospital[]
  doctors: Doctor[]
  doctorSchedulesByDoctorId: Record<ID, DoctorWeeklySchedule>
  appointmentSlots: AppointmentSlot[]
  appointments: Appointment[]

  conversationsByPatientId: Record<ID, Conversation[]>
  timelineByPatientId: Record<ID, TimelineEvent[]>
  benchEntries: BenchEntry[]

  addClient: (input: Omit<Client, 'id'>) => Client
  deleteClient: (id: ID) => void
  updateClient: (id: ID, patch: Partial<Omit<Client, 'id'>>) => void

  addPatient: (input: Omit<Patient, 'id' | 'lastActivityAt' | 'lastContactAt'>) => Patient
  deletePatient: (id: ID) => void
  updatePatient: (id: ID, patch: Partial<Omit<Patient, 'id'>>) => void
  setPatientPriority: (id: ID, priority: PriorityLevel) => void
  setPatientStage: (id: ID, stage: PatientStage) => void

  addHospital: (input: Omit<Hospital, 'id'>) => Hospital
  addDoctor: (input: Omit<Doctor, 'id'>) => Doctor
  setDoctorWeeklySchedule: (
    doctorId: ID,
    slotsByWeekday: DoctorWeeklySchedule['slotsByWeekday'],
  ) => void

  addConversation: (conversation: Omit<Conversation, 'id'>) => Conversation
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => TimelineEvent
  recordCallNoAnswer: (patientId: ID) => void
  bookAppointment: (input: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Appointment
  cancelAppointment: (appointmentId: ID) => void
  rescheduleAppointment: (
    replacesAppointmentId: ID,
    input: Omit<Appointment, 'id' | 'createdAt' | 'status'>,
  ) => Appointment
  notifyPatientWhatsApp: (patientId: ID, bookingEventId: ID) => void
  dropLead: (patientId: ID, reason: string) => void

  loadBenchLeads: () => void
}

const groupByPatient = <T extends { patientId: ID }>(items: T[]) =>
  items.reduce<Record<ID, T[]>>((acc, item) => {
    acc[item.patientId] ??= []
    acc[item.patientId].push(item)
    return acc
  }, {})

export const useHealixStore = create<HealixState>((set, get) => ({
  clients: clientsSeed,
  patients: patientsSeed,
  hospitals: hospitalsSeed,
  doctors: doctorsSeed,
  doctorSchedulesByDoctorId: { ...doctorSchedulesSeed },
  appointmentSlots: [],
  appointments: [],

  conversationsByPatientId: groupByPatient(conversationsSeed),
  timelineByPatientId: groupByPatient(timelineSeed),
  benchEntries: [],

  addClient: (input) => {
    const client: Client = { id: uid('c'), ...input }
    set((s) => ({ clients: [client, ...s.clients] }))
    return client
  },
  deleteClient: (id) => {
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      patients: s.patients.filter((p) => p.clientId !== id),
    }))
  },
  updateClient: (id, patch) => {
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  },

  addPatient: (input) => {
    const nowIso = new Date().toISOString()
    const patient: Patient = {
      id: uid('p'),
      lastActivityAt: nowIso,
      lastContactAt: nowIso,
      ...input,
    }
    set((s) => ({ patients: [patient, ...s.patients] }))
    get().addTimelineEvent({
      patientId: patient.id,
      type: 'patient_added',
      at: nowIso,
      title: 'Patient Added',
      description: `Registered under client partnership.`,
    })
    return patient
  },
  deletePatient: (id) => {
    set((s) => {
      const { [id]: _c, ...restConvos } = s.conversationsByPatientId
      const { [id]: _t, ...restTimeline } = s.timelineByPatientId
      return {
        patients: s.patients.filter((p) => p.id !== id),
        conversationsByPatientId: restConvos,
        timelineByPatientId: restTimeline,
        appointments: s.appointments.filter((a) => a.patientId !== id),
      }
    })
  },
  updatePatient: (id, patch) => {
    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  },
  setPatientPriority: (id, priority) => {
    get().updatePatient(id, { priority })
    get().addTimelineEvent({
      patientId: id,
      type: 'priority_changed',
      at: new Date().toISOString(),
      title: 'Priority Changed',
      description: `Priority updated to ${priority}.`,
    })
  },
  setPatientStage: (id, stage) => {
    get().updatePatient(id, { stage })
  },

  addHospital: (input) => {
    const hospital: Hospital = { id: uid('h'), ...input }
    set((s) => ({ hospitals: [hospital, ...s.hospitals] }))
    return hospital
  },

  addDoctor: (input) => {
    const id = uid('d')
    const schedule = defaultWeeklySchedule(id)
    const doctor: Doctor = {
      ...input,
      id,
      availableThisWeek: hasBookableSlotsThisWeek(schedule, id),
    }
    set((s) => ({
      doctors: [doctor, ...s.doctors],
      doctorSchedulesByDoctorId: {
        ...s.doctorSchedulesByDoctorId,
        [id]: schedule,
      },
    }))
    return doctor
  },

  setDoctorWeeklySchedule: (doctorId, slotsByWeekday) => {
    const schedule: DoctorWeeklySchedule = { doctorId, slotsByWeekday }
    const availableThisWeek = hasBookableSlotsThisWeek(schedule, doctorId)
    set((s) => ({
      doctorSchedulesByDoctorId: {
        ...s.doctorSchedulesByDoctorId,
        [doctorId]: schedule,
      },
      doctors: s.doctors.map((d) =>
        d.id === doctorId ? { ...d, availableThisWeek } : d,
      ),
    }))
  },

  addConversation: (input) => {
    const conversation: Conversation = { id: uid('conv'), ...input }
    set((s) => ({
      conversationsByPatientId: {
        ...s.conversationsByPatientId,
        [conversation.patientId]: [
          conversation,
          ...(s.conversationsByPatientId[conversation.patientId] ?? []),
        ],
      },
    }))

    get().updatePatient(conversation.patientId, {
      lastActivityAt: conversation.createdAt,
      lastContactAt: conversation.createdAt,
      priority: conversation.priorityAfter,
    })

    get().addTimelineEvent({
      patientId: conversation.patientId,
      type: conversation.kind === 'ai' ? 'ai_call' : 'cm_call',
      at: conversation.createdAt,
      title: conversation.kind === 'ai' ? 'AI Call' : 'Case Manager Call',
      description: conversation.summary,
    })

    return conversation
  },

  addTimelineEvent: (input) => {
    const event: TimelineEvent = { id: uid('e'), ...input }
    set((s) => ({
      timelineByPatientId: {
        ...s.timelineByPatientId,
        [event.patientId]: [
          event,
          ...(s.timelineByPatientId[event.patientId] ?? []),
        ],
      },
    }))
    return event
  },

  recordCallNoAnswer: (patientId) => {
    const at = new Date().toISOString()
    get().updatePatient(patientId, {
      lastActivityAt: at,
      lastContactAt: at,
    })
    get().addTimelineEvent({
      patientId,
      type: 'call_no_answer',
      at,
      title: "Didn't Pick Up",
      description: 'Case manager attempted call — patient did not answer.',
    })
  },

  bookAppointment: (input) => {
    const at = new Date().toISOString()
    const appt: Appointment = {
      id: uid('a'),
      createdAt: at,
      status: 'confirmed',
      ...input,
    }
    const { doctors, hospitals } = get()
    const doctor = doctors.find((d) => d.id === appt.doctorId)
    const summary = describeAppointment(doctor, appt, hospitals)

    set((s) => ({ appointments: [appt, ...s.appointments] }))
    get().updatePatient(appt.patientId, { lastActivityAt: at })
    get().addTimelineEvent({
      patientId: appt.patientId,
      type: 'appointment_booked',
      at,
      title: 'Appointment Booked',
      description: summary ? `Confirmed — ${summary}` : 'Appointment confirmed.',
      details: {
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        slotId: appt.slotId,
      },
    })
    return appt
  },

  cancelAppointment: (appointmentId) => {
    const appt = get().appointments.find((a) => a.id === appointmentId)
    if (!appt || appt.status === 'cancelled') return

    const at = new Date().toISOString()
    const { doctors, hospitals } = get()
    const doctor = doctors.find((d) => d.id === appt.doctorId)
    const summary = describeAppointment(doctor, appt, hospitals)

    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a,
      ),
    }))
    get().updatePatient(appt.patientId, { lastActivityAt: at })
    get().addTimelineEvent({
      patientId: appt.patientId,
      type: 'appointment_cancelled',
      at,
      title: 'Appointment Cancelled',
      description: summary ? `Cancelled — ${summary}` : 'Appointment cancelled.',
      details: {
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        slotId: appt.slotId,
      },
    })
  },

  rescheduleAppointment: (replacesAppointmentId, input) => {
    const oldAppt = get().appointments.find((a) => a.id === replacesAppointmentId)
    if (!oldAppt || oldAppt.status === 'cancelled') {
      return get().bookAppointment(input)
    }

    const at = new Date().toISOString()
    const { doctors, hospitals } = get()
    const oldDoctor = doctors.find((d) => d.id === oldAppt.doctorId)
    const oldSummary = describeAppointment(oldDoctor, oldAppt, hospitals)

    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === replacesAppointmentId ? { ...a, status: 'cancelled' as const } : a,
      ),
    }))

    const newAppt: Appointment = {
      id: uid('a'),
      createdAt: at,
      status: 'confirmed',
      ...input,
    }
    const newDoctor = doctors.find((d) => d.id === newAppt.doctorId)
    const newSummary = describeAppointment(newDoctor, newAppt, hospitals)

    set((s) => ({ appointments: [newAppt, ...s.appointments] }))
    get().updatePatient(newAppt.patientId, { lastActivityAt: at })
    get().addTimelineEvent({
      patientId: newAppt.patientId,
      type: 'appointment_rescheduled',
      at,
      title: 'Appointment Rescheduled',
      description: [
        oldSummary ? `From: ${oldSummary}` : undefined,
        newSummary ? `To: ${newSummary}` : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
      details: {
        appointmentId: newAppt.id,
        replacedAppointmentId: replacesAppointmentId,
        doctorId: newAppt.doctorId,
        slotId: newAppt.slotId,
      },
    })
    return newAppt
  },

  notifyPatientWhatsApp: (patientId, bookingEventId) => {
    const patient = get().patients.find((p) => p.id === patientId)
    const events = get().timelineByPatientId[patientId] ?? []
    const bookingEvent = events.find((e) => e.id === bookingEventId)
    if (!patient || bookingEvent?.type !== 'appointment_booked') return

    const doctorId = bookingEvent.details?.doctorId as string | undefined
    const slotId = bookingEvent.details?.slotId as string | undefined
    const appointmentId = bookingEvent.details?.appointmentId as string | undefined

    const appointment =
      (appointmentId
        ? get().appointments.find((a) => a.id === appointmentId)
        : undefined) ??
      get().appointments.find(
        (a) =>
          a.patientId === patientId &&
          a.doctorId === doctorId &&
          a.slotId === slotId,
      )

    if (!appointment || appointment.status === 'cancelled') return

    const doctor = get().doctors.find(
      (d) => d.id === (appointment?.doctorId ?? doctorId),
    )

    const message = buildBookingWhatsAppMessage(
      patient,
      doctor,
      appointment,
      get().hospitals,
    )
    window.open(buildWhatsAppUrl(patient.mobile, message), '_blank', 'noopener,noreferrer')

    const at = new Date().toISOString()
    const when = [appointment?.slotDateLabel, appointment?.slotTimeLabel]
      .filter(Boolean)
      .join(' · ')

    get().updatePatient(patientId, { lastActivityAt: at })
    get().addTimelineEvent({
      patientId,
      type: 'patient_whatsapp_notified',
      at,
      title: 'Patient Notified on WhatsApp',
      description: [
        'Booking confirmation opened in WhatsApp',
        doctor?.name,
        doctorHospitalName(doctor, get().hospitals),
        when || undefined,
      ]
        .filter(Boolean)
        .join(' — '),
      details: {
        appointmentId: appointment?.id,
        relatedBookingEventId: bookingEventId,
      },
    })
  },

  dropLead: (patientId, reason) => {
    const trimmed = reason.trim()
    if (!trimmed) return
    const at = new Date().toISOString()
    set((s) => ({
      benchEntries: s.benchEntries.filter((e) => e.patientId !== patientId),
      patients: s.patients.map((p) =>
        p.id === patientId ? { ...p, stage: 'cold', lastActivityAt: at } : p,
      ),
    }))
    get().addTimelineEvent({
      patientId,
      type: 'lead_dropped',
      at,
      title: 'Lead Dropped',
      description: trimmed,
      details: { reason: trimmed },
    })
  },

  loadBenchLeads: () => {
    const leads = get().patients.slice(0, 10)
    const leadIds = new Set(leads.map((p) => p.id))
    set((s) => ({
      benchEntries: leads.map((p): BenchEntry => ({ patientId: p.id })),
      patients: s.patients.map((p) =>
        leadIds.has(p.id) ? { ...p, stage: 'fresh' as PatientStage } : p,
      ),
    }))
  },
}))

