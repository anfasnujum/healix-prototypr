import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientStageSelect } from '../components/PatientStageSelect'
import { Button } from '../components/ui/Button'
import { useHealixStore } from '../store/useHealixStore'
import type { Patient } from '../types'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}

export function BenchPage() {
  const navigate = useNavigate()
  const patients = useHealixStore((s) => s.patients)
  const clients = useHealixStore((s) => s.clients)
  const benchEntries = useHealixStore((s) => s.benchEntries)
  const loadBenchLeads = useHealixStore((s) => s.loadBenchLeads)
  const setPatientStage = useHealixStore((s) => s.setPatientStage)

  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients],
  )

  const patientsById = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p])),
    [patients],
  )

  const benchRows = useMemo(
    () =>
      benchEntries
        .map((entry) => {
          const patient = patientsById[entry.patientId]
          if (!patient) return null
          return { entry, patient }
        })
        .filter((row): row is { entry: (typeof benchEntries)[0]; patient: Patient } =>
          row !== null,
        ),
    [benchEntries, patientsById],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Bench
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Your daily work queue — load leads and track stage as you work each patient.
          </p>
        </div>
        <Button onClick={() => loadBenchLeads()}>
          <Download className="h-4 w-4" />
          Load Leads
        </Button>
      </div>

      <div className="healix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Reg ID</th>
                <th className="px-6 py-3">Mobile</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Last Activity</th>
                <th className="px-6 py-3">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {benchRows.map(({ patient }) => (
                <tr
                  key={patient.id}
                  className="cursor-pointer hover:bg-gray-50/60"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-healix-teal/10 text-xs font-semibold text-healix-navy">
                        {initials(patient.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {patient.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {patient.nationalId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{patient.registrationId}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.mobile}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.zone}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {clientsById[patient.clientId]?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(patient.lastActivityAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                    <PatientStageSelect
                      value={patient.stage}
                      patientName={patient.name}
                      onChange={(stage) => setPatientStage(patient.id, stage)}
                    />
                  </td>
                </tr>
              ))}
              {benchRows.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No leads on the bench yet. Click{' '}
                    <span className="font-medium text-slate-700">Load Leads</span> to pull up to
                    10 patients from your list.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
