import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Eye, Plus, Trash2, Users2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/modals/Modal'
import { PriorityBadge } from '../components/PriorityBadge'
import { ZoneDropdown } from '../components/inputs/ZoneDropdown'
import { useHealixStore } from '../store/useHealixStore'
import { PatientStageSelect } from '../components/PatientStageSelect'
import type { PriorityLevel, Zone } from '../types'

export function ClientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useHealixStore((s) => s.clients.find((c) => c.id === id))
  const patients = useHealixStore((s) => s.patients.filter((p) => p.clientId === id))
  const addPatient = useHealixStore((s) => s.addPatient)
  const deletePatient = useHealixStore((s) => s.deletePatient)
  const setPatientStage = useHealixStore((s) => s.setPatientStage)

  const [addOpen, setAddOpen] = useState(false)
  const [patientForm, setPatientForm] = useState<{
    name: string
    mobile: string
    nationalId: string
    zone?: Zone
    priority: PriorityLevel
    registrationId: string
  }>({
    name: '',
    mobile: '',
    nationalId: '',
    zone: undefined,
    priority: 'none',
    registrationId: `HX-OM-${Math.floor(10000 + Math.random() * 90000)}`,
  })

  const chartData = useMemo(
    () => [
      { month: 'Jan', treatments: 18 },
      { month: 'Feb', treatments: 22 },
      { month: 'Mar', treatments: 27 },
      { month: 'Apr', treatments: 19 },
      { month: 'May', treatments: 31 },
      { month: 'Jun', treatments: 24 },
    ],
    [],
  )

  const avgPriority = useMemo(() => {
    const score = (p: PriorityLevel) =>
      p === 'urgent' ? 3 : p === 'moderate' ? 2 : p === 'low' ? 1 : 0
    const total = patients.reduce((acc, p) => acc + score(p.priority), 0)
    const v = patients.length ? total / patients.length : 0
    if (v >= 2.5) return { label: 'High', color: 'text-rose-700 bg-rose-50 ring-rose-200' }
    if (v >= 1.5)
      return { label: 'Medium', color: 'text-amber-800 bg-amber-50 ring-amber-200' }
    if (v >= 0.5)
      return { label: 'Low', color: 'text-teal-800 bg-teal-50 ring-teal-200' }
    return { label: 'None', color: 'text-gray-700 bg-gray-100 ring-gray-200' }
  }, [patients])

  if (!client) {
    return (
      <div className="healix-card px-6 py-5">
        <div className="font-display text-2xl font-semibold text-slate-900">
          Client not found
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Go back to{' '}
          <Link className="text-healix-teal hover:underline" to="/clients">
            Clients
          </Link>
          .
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="mt-1 rounded-xl border border-gray-200 bg-white p-2 text-slate-700 transition-all duration-200 hover:bg-gray-50"
            onClick={() => navigate('/clients')}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-semibold"
              style={{
                backgroundColor: `${client.brandColor}1A`,
                color: client.brandColor,
              }}
            >
              {client.name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                  {client.name}
                </div>
                <StatusBadge active={client.status === 'active'} />
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Partnership since{' '}
                {new Date(client.partnershipStartDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <Button variant="secondary">Edit</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={patients.length}
          icon={<Users2 className="h-5 w-5" />}
        />
        <StatCard label="Active Treatments" value={Math.max(0, patients.length * 2)} />
        <StatCard label="Appointments This Month" value={Math.max(0, patients.length)} />
        <StatCard
          label="Avg. Priority Level"
          value={
            <span className="inline-flex items-center gap-2">
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                  avgPriority.color,
                ].join(' ')}
              >
                {avgPriority.label}
              </span>
            </span>
          }
        />
      </div>

      <div className="healix-card p-6">
        <div className="mb-4 text-sm font-semibold text-slate-900">
          Treatments by Month
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <Tooltip
                cursor={{ fill: 'rgba(0,201,177,0.08)' }}
                contentStyle={{
                  borderRadius: 16,
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                }}
              />
              <Bar dataKey="treatments" fill="#00C9B1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="healix-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-slate-900">
              Registered Patients
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Patients registered under this partnership.
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Patient
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Registration ID</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Stage</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Last Contact</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-3 text-slate-600">{p.registrationId}</td>
                  <td className="px-6 py-3 text-slate-600">{p.zone}</td>
                  <td className="px-6 py-3">
                    <PatientStageSelect
                      value={p.stage}
                      patientName={p.name}
                      onChange={(stage) => setPatientStage(p.id, stage)}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <PriorityBadge level={p.priority} />
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(p.lastContactAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900"
                        aria-label="View"
                        onClick={() => navigate(`/patients/${p.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-rose-700 transition-all duration-200 hover:bg-rose-50"
                        aria-label="Delete"
                        onClick={() => deletePatient(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={7}>
                    No patients registered for this client yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Add Patient"
        description="Register a patient under this client."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!id) return
                const nowIso = new Date().toISOString()
                addPatient({
                  name: patientForm.name.trim() || 'New Patient',
                  mobile: patientForm.mobile.trim() || '+968',
                  nationalId: patientForm.nationalId.trim() || 'OMN-',
                  zone: patientForm.zone ?? 'Muscat',
                  clientId: id,
                  priority: patientForm.priority,
                  stage: 'fresh',
                  registrationId: patientForm.registrationId,
                  registrationDate: nowIso,
                })
                setAddOpen(false)
                setPatientForm((s) => ({
                  ...s,
                  name: '',
                  mobile: '',
                  nationalId: '',
                  zone: undefined,
                  priority: 'none',
                  registrationId: `HX-OM-${Math.floor(
                    10000 + Math.random() * 90000,
                  )}`,
                }))
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Name"
            value={patientForm.name}
            onChange={(e) => setPatientForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Mobile"
            value={patientForm.mobile}
            onChange={(e) =>
              setPatientForm((s) => ({ ...s, mobile: e.target.value }))
            }
          />
          <Input
            label="Emirates/Oman National ID"
            value={patientForm.nationalId}
            onChange={(e) =>
              setPatientForm((s) => ({ ...s, nationalId: e.target.value }))
            }
          />
          <Input
            label="Registration ID"
            value={patientForm.registrationId}
            onChange={(e) =>
              setPatientForm((s) => ({ ...s, registrationId: e.target.value }))
            }
          />
          <div className="md:col-span-2">
            <ZoneDropdown
              label="Zone"
              value={patientForm.zone}
              onChange={(zone) => setPatientForm((s) => ({ ...s, zone }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

