import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ZoneDropdown } from '../components/inputs/ZoneDropdown'
import { Modal } from '../components/modals/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useHealixStore } from '../store/useHealixStore'
import type { Zone } from '../types'

export function HospitalsPage() {
  const hospitals = useHealixStore((s) => s.hospitals)
  const doctors = useHealixStore((s) => s.doctors)
  const addHospital = useHealixStore((s) => s.addHospital)

  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [zone, setZone] = useState<Zone | undefined>('Muscat')

  const doctorsByHospitalId = useMemo(() => {
    return doctors.reduce<Record<string, number>>((acc, d) => {
      acc[d.hospitalId] = (acc[d.hospitalId] ?? 0) + 1
      return acc
    }, {})
  }, [doctors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...hospitals].sort((a, b) => a.name.localeCompare(b.name))
    if (!q) return list
    return list.filter((h) =>
      [h.name, h.zone].some((v) => v.toLowerCase().includes(q)),
    )
  }, [hospitals, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Hospitals
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Partner facilities where Healix doctors practice and appointments are booked.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="w-full md:w-[320px]">
            <Input
              placeholder="Search hospitals…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Hospital
          </Button>
        </div>
      </div>

      <div className="healix-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Hospital</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Doctors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((h) => (
                <tr key={h.id} className="text-slate-700">
                  <td className="px-6 py-4 font-medium text-slate-900">{h.name}</td>
                  <td className="px-6 py-4">{h.zone}</td>
                  <td className="px-6 py-4">{doctorsByHospitalId[h.id] ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No hospitals match your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Add Hospital"
        description="Register a facility for doctor assignments and booking."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                addHospital({
                  name: name.trim() || 'New Hospital',
                  zone: zone ?? 'Muscat',
                })
                setAddOpen(false)
                setName('')
                setZone('Muscat')
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Hospital Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <div className="mb-1 text-sm font-medium text-slate-800">Zone</div>
            <ZoneDropdown value={zone} onChange={setZone} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
