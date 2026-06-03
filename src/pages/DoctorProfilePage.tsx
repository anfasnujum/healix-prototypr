import { ArrowLeft, CalendarClock } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DoctorWeeklyScheduleEditor } from '../components/DoctorWeeklyScheduleEditor'
import {
  buildBookableWeek,
  countSlotsInSchedule,
  hasBookableSlotsThisWeek,
} from '../lib/doctorSchedule'
import { doctorHospitalName } from '../lib/hospitalLookup'
import { useHealixStore } from '../store/useHealixStore'

export function DoctorProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const doctor = useHealixStore((s) => s.doctors.find((d) => d.id === id))
  const hospitals = useHealixStore((s) => s.hospitals)
  const schedule = useHealixStore((s) =>
    id ? s.doctorSchedulesByDoctorId[id] : undefined,
  )
  const setDoctorWeeklySchedule = useHealixStore((s) => s.setDoctorWeeklySchedule)

  const previewWeek = useMemo(
    () => (id ? buildBookableWeek(id, schedule) : []),
    [id, schedule],
  )

  const bookableCount = useMemo(
    () => previewWeek.reduce((n, d) => n + d.available.length, 0),
    [previewWeek],
  )

  if (!doctor || !id) {
    return (
      <div className="healix-card px-6 py-5">
        <div className="font-display text-2xl font-semibold text-slate-900">
          Doctor not found
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Go back to{' '}
          <Link className="text-healix-teal hover:underline" to="/doctors">
            Doctors
          </Link>
          .
        </div>
      </div>
    )
  }

  const hospitalName = doctorHospitalName(doctor, hospitals)
  const templateSlots = countSlotsInSchedule(schedule)
  const availableThisWeek = hasBookableSlotsThisWeek(schedule, id)

  const activeSchedule = schedule ?? { doctorId: id, slotsByWeekday: {} }

  return (
    <div className="space-y-6">
      <div className="healix-card px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="mt-0.5 rounded-xl border border-gray-200 bg-white p-2 text-slate-700 transition-all duration-200 hover:bg-gray-50"
              onClick={() => navigate('/doctors')}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                {doctor.name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {doctor.department} · {doctor.specialty}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-800">{hospitalName}</div>
              <div className="mt-3">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    availableThisWeek
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {availableThisWeek
                    ? `${bookableCount} bookable slot${bookableCount === 1 ? '' : 's'} in the next 7 days`
                    : 'No bookable slots in the next 7 days'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="healix-card px-6 py-6 xl:col-span-2">
          <div className="text-sm font-semibold text-slate-900">Weekly schedule template</div>
          <p className="mt-1 text-sm text-slate-500">
            Set which time slots repeat each week. Case managers see the next 7 calendar days
            generated from this template when booking appointments.
          </p>
          <div className="mt-5">
            <DoctorWeeklyScheduleEditor
              schedule={activeSchedule}
              onSave={(slotsByWeekday) => setDoctorWeeklySchedule(id, slotsByWeekday)}
            />
          </div>
        </div>

        <div className="healix-card px-6 py-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarClock className="h-4 w-4 text-healix-teal" />
            Booking preview (next 7 days)
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {templateSlots} recurring slot{templateSlots === 1 ? '' : 's'} per week in template
          </p>
          <div className="mt-4 space-y-4">
            {previewWeek.map((day) => (
              <div key={day.date}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {day.dayLabel}
                </div>
                {day.available.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {day.available.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No slots</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
