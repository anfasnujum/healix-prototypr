import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/modals/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { hasBookableSlotsThisWeek } from '../lib/doctorSchedule'
import { doctorHospitalName, hospitalsById } from '../lib/hospitalLookup'
import { useHealixStore } from '../store/useHealixStore'

export function DoctorsPage() {
  const navigate = useNavigate()
  const hospitals = useHealixStore((s) => s.hospitals)
  const doctors = useHealixStore((s) => s.doctors)
  const doctorSchedulesByDoctorId = useHealixStore((s) => s.doctorSchedulesByDoctorId)
  const addDoctor = useHealixStore((s) => s.addDoctor)

  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id ?? '')

  const hospitalMap = useMemo(() => hospitalsById(hospitals), [hospitals])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...doctors].sort((a, b) => a.name.localeCompare(b.name))
    if (!q) return list
    return list.filter((d) => {
      const hospitalName = doctorHospitalName(d, hospitals, hospitalMap)
      return [d.name, d.department, d.specialty, hospitalName].some((v) =>
        v.toLowerCase().includes(q),
      )
    })
  }, [doctors, query, hospitals, hospitalMap])

  const sortedHospitals = useMemo(
    () => [...hospitals].sort((a, b) => a.name.localeCompare(b.name)),
    [hospitals],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Doctors
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Clinical staff available for case manager bookings, grouped by hospital.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="w-full md:w-[360px]">
            <Input
              placeholder="Search name, specialty, hospital…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setHospitalId(sortedHospitals[0]?.id ?? '')
              setAddOpen(true)
            }}
            disabled={sortedHospitals.length === 0}
          >
            <Plus className="h-4 w-4" /> Add Doctor
          </Button>
        </div>
      </div>

      {sortedHospitals.length === 0 ? (
        <div className="healix-card px-6 py-6 text-sm text-slate-600">
          Add a hospital first, then you can register doctors under that facility.
        </div>
      ) : (
        <div className="healix-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Specialty</th>
                  <th className="px-6 py-3">Hospital</th>
                  <th className="px-6 py-3">This Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="cursor-pointer text-slate-700 transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/doctors/${d.id}`)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                    <td className="px-6 py-4">{d.department}</td>
                    <td className="px-6 py-4">{d.specialty}</td>
                    <td className="px-6 py-4">
                      {doctorHospitalName(d, hospitals, hospitalMap)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                          hasBookableSlotsThisWeek(doctorSchedulesByDoctorId[d.id], d.id)
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {hasBookableSlotsThisWeek(doctorSchedulesByDoctorId[d.id], d.id)
                          ? 'Available'
                          : 'No slots'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No doctors match your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={addOpen}
        title="Add Doctor"
        description="Add a clinician linked to a hospital for appointment booking."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!hospitalId}
              onClick={() => {
                if (!hospitalId) return
                addDoctor({
                  name: name.trim() || 'Dr. New Doctor',
                  department: department.trim() || 'General',
                  specialty: specialty.trim() || 'General Practice',
                  hospitalId,
                  availableThisWeek: true,
                })
                setAddOpen(false)
                setName('')
                setDepartment('')
                setSpecialty('')
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. …"
          />
          <label className="block md:col-span-2">
            <div className="mb-1 text-sm font-medium text-slate-800">Hospital</div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              {sortedHospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <Input
            label="Specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <p className="text-sm text-slate-500 md:col-span-2">
            A default Mon–Fri schedule is created. Open the doctor profile to customize weekly
            availability.
          </p>
        </div>
      </Modal>
    </div>
  )
}
