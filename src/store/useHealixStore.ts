import { create } from 'zustand'
import type {
  Appointment,
  AppointmentSlot,
  Client,
  Conversation,
  Doctor,
  Patient,
  TimelineEvent,
  ID,
  PatientStatus,
  PriorityLevel,
} from '../types'
import {
  clientsSeed,
  conversationsSeed,
  doctorsSeed,
  patientsSeed,
  timelineSeed,
} from '../mock/seed'

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`

export type HealixState = {
  clients: Client[]
  patients: Patient[]
  doctors: Doctor[]
  appointmentSlots: AppointmentSlot[]
  appointments: Appointment[]

  conversationsByPatientId: Record<ID, Conversation[]>
  timelineByPatientId: Record<ID, TimelineEvent[]>

  addClient: (input: Omit<Client, 'id'>) => Client
  deleteClient: (id: ID) => void
  updateClient: (id: ID, patch: Partial<Omit<Client, 'id'>>) => void

  addPatient: (input: Omit<Patient, 'id' | 'lastActivityAt' | 'lastContactAt'>) => Patient
  deletePatient: (id: ID) => void
  updatePatient: (id: ID, patch: Partial<Omit<Patient, 'id'>>) => void
  setPatientStatus: (id: ID, status: PatientStatus) => void
  setPatientPriority: (id: ID, priority: PriorityLevel) => void

  addConversation: (conversation: Omit<Conversation, 'id'>) => Conversation
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => TimelineEvent
  bookAppointment: (input: Omit<Appointment, 'id' | 'createdAt'>) => Appointment
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
  doctors: doctorsSeed,
  appointmentSlots: [],
  appointments: [],

  conversationsByPatientId: groupByPatient(conversationsSeed),
  timelineByPatientId: groupByPatient(timelineSeed),

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
  setPatientStatus: (id, status) => {
    get().updatePatient(id, { status })
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

  bookAppointment: (input) => {
    const appt: Appointment = {
      id: uid('a'),
      createdAt: new Date().toISOString(),
      ...input,
    }
    set((s) => ({ appointments: [appt, ...s.appointments] }))
    get().addTimelineEvent({
      patientId: appt.patientId,
      type: 'appointment_booked',
      at: appt.createdAt,
      title: 'Appointment Booked',
      description: 'Appointment confirmed.',
      details: { doctorId: appt.doctorId, slotId: appt.slotId },
    })
    return appt
  },
}))

