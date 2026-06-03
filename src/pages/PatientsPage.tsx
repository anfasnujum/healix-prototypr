import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientTable } from '../components/PatientTable'
import { Modal } from '../components/modals/Modal'
import { ZoneDropdown } from '../components/inputs/ZoneDropdown'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { OMAN_ZONES } from '../mock/constants'
import { useHealixStore } from '../store/useHealixStore'
import type { PatientStage, PriorityLevel, Zone } from '../types'

type FilterState = {
  zone?: Zone | 'all'
  stage?: PatientStage | 'all'
  priority?: PriorityLevel | 'all'
  clientId?: string | 'all'
}

export function PatientsPage() {
  const navigate = useNavigate()
  const clients = useHealixStore((s) => s.clients)
  const patients = useHealixStore((s) => s.patients)
  const addPatient = useHealixStore((s) => s.addPatient)
  const deletePatient = useHealixStore((s) => s.deletePatient)
  const setPatientStage = useHealixStore((s) => s.setPatientStage)

  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients],
  )

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    zone: 'all',
    stage: 'all',
    priority: 'all',
    clientId: 'all',
  })

  const [addOpen, setAddOpen] = useState(false)
  const [zone, setZone] = useState<Zone | undefined>(undefined)
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? '')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [nationalId, setNationalId] = useState('')

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return patients.filter((p) => {
      if (filters.zone && filters.zone !== 'all' && p.zone !== filters.zone) return false
      if (filters.stage && filters.stage !== 'all' && p.stage !== filters.stage)
        return false
      if (
        filters.priority &&
        filters.priority !== 'all' &&
        p.priority !== filters.priority
      )
        return false
      if (filters.clientId && filters.clientId !== 'all' && p.clientId !== filters.clientId)
        return false

      if (!q) return true
      return [p.name, p.mobile, p.registrationId].some((v) =>
        v.toLowerCase().includes(q),
      )
    })
  }, [patients, query, filters])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          Patients
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="w-full md:w-[360px]">
            <Input
              placeholder="Search name, mobile, reg ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Patient
          </Button>
        </div>
      </div>

      <div className="healix-card px-5 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-800">Zone</div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={filters.zone ?? 'all'}
              onChange={(e) =>
                setFilters((s) => ({
                  ...s,
                  zone: e.target.value === 'all' ? 'all' : (e.target.value as Zone),
                }))
              }
            >
              <option value="all">All zones</option>
              {OMAN_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-800">Stage</div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={filters.stage ?? 'all'}
              onChange={(e) =>
                setFilters((s) => ({ ...s, stage: e.target.value as FilterState['stage'] }))
              }
            >
              <option value="all">All stages</option>
              <option value="fresh">Fresh</option>
              <option value="unattended">Didn't Pick Up</option>
              <option value="active">Active</option>
              <option value="cold">Cold</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-800">Priority</div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={filters.priority ?? 'all'}
              onChange={(e) =>
                setFilters((s) => ({
                  ...s,
                  priority: e.target.value as FilterState['priority'],
                }))
              }
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-800">Client</div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={filters.clientId ?? 'all'}
              onChange={(e) =>
                setFilters((s) => ({
                  ...s,
                  clientId: e.target.value as FilterState['clientId'],
                }))
              }
            >
              <option value="all">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <PatientTable
        patients={filteredPatients}
        clientsById={clientsById}
        onView={(pid) => navigate(`/patients/${pid}`)}
        onDelete={(pid) => deletePatient(pid)}
        onStageChange={(pid, stage) => setPatientStage(pid, stage)}
      />

      <Modal
        open={addOpen}
        title="Add Patient"
        description="Register a new patient in Healix."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const nowIso = new Date().toISOString()
                addPatient({
                  name: name.trim() || 'New Patient',
                  mobile: mobile.trim() || '+968',
                  nationalId: nationalId.trim() || 'OMN-',
                  zone: zone ?? 'Muscat',
                  clientId: clientId || clients[0]?.id || 'c-unknown',
                  priority: 'none',
                  stage: 'fresh',
                  registrationId: `HX-OM-${Math.floor(10000 + Math.random() * 90000)}`,
                  registrationDate: nowIso,
                })
                setAddOpen(false)
                setName('')
                setMobile('')
                setNationalId('')
                setZone(undefined)
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <Input
            label="Emirates/Oman National ID"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-800">
              Assign to Client
            </div>
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <ZoneDropdown label="Zone" value={zone} onChange={(z) => setZone(z)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

