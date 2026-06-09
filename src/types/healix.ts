export type ID = string

export type PartnershipStatus = 'active' | 'inactive'

export type PriorityLevel = 'urgent' | 'moderate' | 'low' | 'none'

export type PatientStage = 'fresh' | 'unattended' | 'active' | 'cold'

export type BenchEntry = {
  patientId: ID
}

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
  priority: PriorityLevel
  stage: PatientStage
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

/** YYYY-MM-DD */
export type PreferredDate = string

/** e.g. "09:00–09:30" */
export type PreferredTimeSlot = string

export type CaseFormData = {
  location?: string
  zone?: Zone
  symptoms: Symptom[]
  preferredDates?: PreferredDate[]
  preferredTimeSlots?: PreferredTimeSlot[]
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
  | 'call_no_answer'
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'patient_whatsapp_notified'
  | 'patient_added'
  | 'priority_changed'
  | 'lead_dropped'

export type TimelineEvent = {
  id: ID
  patientId: ID
  type: TimelineEventType
  at: string // ISO
  title: string
  description: string
  details?: Record<string, unknown>
}

export type Hospital = {
  id: ID
  name: string
  zone: Zone
}

/** 0 = Sunday … 6 = Saturday (matches `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DoctorWeeklySchedule = {
  doctorId: ID
  slotsByWeekday: Partial<Record<Weekday, PreferredTimeSlot[]>>
}

export type Doctor = {
  id: ID
  name: string
  department: string
  specialty: string
  hospitalId: ID
  /** Derived from weekly schedule — any bookable slot in the next 7 days. */
  availableThisWeek: boolean
}

export type AppointmentSlot = {
  id: ID
  doctorId: ID
  start: string // ISO
  end: string // ISO
}

export type AppointmentStatus = 'confirmed' | 'cancelled'

export type Appointment = {
  id: ID
  patientId: ID
  clientId: ID
  doctorId: ID
  slotId: ID
  status: AppointmentStatus
  createdAt: string // ISO
  notes?: string
  /** Set when booking from the modal for display on the patient profile */
  slotDateLabel?: string
  slotTimeLabel?: string
}

export type UserRole = 'admin' | 'case_manager'

export type UserStatus = 'active' | 'inactive'

export type User = {
  id: ID
  name: string
  email: string
  /** Prototype only — not hashed. */
  password: string
  role: UserRole
  status: UserStatus
  createdAt: string // ISO
}

