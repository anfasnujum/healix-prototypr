import { ArrowUpDown, Eye, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Client, Patient, PatientStage } from '../types'
import { PatientStageSelect } from './PatientStageSelect'
import { PriorityBadge } from './PriorityBadge'

type SortKey = 'name' | 'registrationId' | 'zone' | 'client' | 'stage' | 'lastActivityAt'
type SortDir = 'asc' | 'desc'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}

export function PatientTable({
  patients,
  clientsById,
  onView,
  onDelete,
  onStageChange,
}: {
  patients: Patient[]
  clientsById: Record<string, Client>
  onView: (patientId: string) => void
  onDelete: (patientId: string) => void
  onStageChange: (patientId: string, stage: PatientStage) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('lastActivityAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    const val = (p: Patient): string | number => {
      switch (sortKey) {
        case 'name':
          return p.name
        case 'registrationId':
          return p.registrationId
        case 'zone':
          return p.zone
        case 'client':
          return clientsById[p.clientId]?.name ?? ''
        case 'stage':
          return p.stage
        case 'lastActivityAt':
          return new Date(p.lastActivityAt).getTime()
      }
    }
    return [...patients].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [patients, clientsById, sortDir, sortKey])

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 transition-all duration-200 hover:text-slate-800"
      onClick={() => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        else {
          setSortKey(key)
          setSortDir('asc')
        }
      }}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
    </button>
  )

  return (
    <div className="healix-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">{sortButton('name', 'Patient')}</th>
              <th className="px-6 py-3">{sortButton('registrationId', 'Reg ID')}</th>
              <th className="px-6 py-3">Mobile</th>
              <th className="px-6 py-3">{sortButton('zone', 'Zone')}</th>
              <th className="px-6 py-3">{sortButton('client', 'Client')}</th>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">{sortButton('stage', 'Stage')}</th>
              <th className="px-6 py-3">{sortButton('lastActivityAt', 'Last Activity')}</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer hover:bg-gray-50/60"
                onClick={() => onView(p.id)}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-healix-teal/10 text-xs font-semibold text-healix-navy">
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">
                        {p.name}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {p.nationalId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-600">{p.registrationId}</td>
                <td className="px-6 py-3 text-slate-600">{p.mobile}</td>
                <td className="px-6 py-3 text-slate-600">{p.zone}</td>
                <td className="px-6 py-3 text-slate-600">
                  {clientsById[p.clientId]?.name ?? '—'}
                </td>
                <td className="px-6 py-3">
                  <PriorityBadge level={p.priority} />
                </td>
                <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                  <PatientStageSelect
                    value={p.stage}
                    patientName={p.name}
                    onChange={(stage) => onStageChange(p.id, stage)}
                  />
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {new Date(p.lastActivityAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3">
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900"
                      aria-label="View"
                      onClick={() => onView(p.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-rose-700 transition-all duration-200 hover:bg-rose-50"
                      aria-label="Delete"
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-slate-500" colSpan={9}>
                  No patients match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

