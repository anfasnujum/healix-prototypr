export type ID = string

export type PartnershipStatus = 'active' | 'inactive'

export type PatientStatus = 'active' | 'inactive'

export type PriorityLevel = 'urgent' | 'moderate' | 'low' | 'none'

export type ConversationKind = 'ai' | 'cm'

export type TimeRangePreset =
  | 'morning_8_12'
  | 'afternoon_12_5'
  | 'evening_5_8'
  | 'hour_slots'

export type Zone =
  | 'Muscat'
  | 'Salalah'
  | 'Sohar'
  | 'Nizwa'
  | 'Sur'
  | 'Ibri'
  | 'Buraimi'
  | 'Khasab'
  | 'Duqm'
  | 'Rustaq'
  | 'Seeb'
  | 'Muttrah'
  | 'Bahla'
  | 'Ibra'
  | 'Barka'
  | 'Bidbid'

export type Symptom =
  | 'Chest Pain'
  | 'Shortness of Breath'
  | 'Fatigue'
  | 'Headache'
  | 'Fever'
  | 'Back Pain'
  | 'Joint Pain'
  | 'Dizziness'
  | 'Nausea'
  | 'Cough'
  | 'Sore Throat'
  | 'Palpitations'
  | 'Abdominal Pain'

export type Client = {
  id: ID
  name: string
  industry: string
  contactPerson: string
  email: string
  phone: string
  partnershipStartDate: string // ISO
  status: PartnershipStatus
  brandColor: string // hex
}

export type Patient = {
  id: ID
  name: string
  registrationId: string
  mobile: string
  nationalId: string
  zone: Zone
  clientId: ID
  status: PatientStatus
  priority: PriorityLevel
  registrationDate: string // ISO
  lastActivityAt: string // ISO
  lastContactAt: string // ISO
  notes?: string
}

export type TranscriptLine = {
  id: ID
  speaker: 'case_manager' | 'patient' | 'ai'
  text: string
  at: string // ISO
}

export type AIRecommendation = {
  department: string
  suggestedDoctors: Array<{ name: string; specialty: string; hospital: string }>
  confidence: number // 0-1
}

export type PreferredDateRange = { start: string; end: string } // ISO
export type PreferredTimeRange =
  | { preset: 'morning_8_12' | 'afternoon_12_5' | 'evening_5_8' }
  | { preset: 'hour_slots'; start: string; end: string } // "HH:mm"

export type CaseFormData = {
  zone?: Zone
  symptoms: Symptom[]
  preferredDateRange?: PreferredDateRange
  preferredTimeRange?: PreferredTimeRange
  aiRecommendation?: AIRecommendation
}

export type Conversation = {
  id: ID
  patientId: ID
  kind: ConversationKind
  title: string
  createdAt: string // ISO
  durationSeconds: number
  summary: string
  priorityAfter: PriorityLevel
  transcript: TranscriptLine[]
  caseForm: CaseFormData
}

export type TimelineEventType =
  | 'ai_call'
  | 'cm_call'
  | 'appointment_booked'
  | 'patient_added'
  | 'priority_changed'

export type TimelineEvent = {
  id: ID
  patientId: ID
  type: TimelineEventType
  at: string // ISO
  title: string
  description: string
  details?: Record<string, unknown>
}

export type Doctor = {
  id: ID
  name: string
  department: string
  specialty: string
  hospital: string
  availableThisWeek: boolean
}

export type AppointmentSlot = {
  id: ID
  doctorId: ID
  start: string // ISO
  end: string // ISO
}

export type Appointment = {
  id: ID
  patientId: ID
  clientId: ID
  doctorId: ID
  slotId: ID
  createdAt: string // ISO
  notes?: string
}

