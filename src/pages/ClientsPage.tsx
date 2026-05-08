import { useMemo, useState } from 'react'
import { ClientCard } from '../components/ClientCard'
import { Modal } from '../components/modals/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useHealixStore } from '../store/useHealixStore'

type AddClientForm = {
  name: string
  industry: string
  contactPerson: string
  email: string
  phone: string
  partnershipStartDate: string
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function ClientsPage() {
  const clients = useHealixStore((s) => s.clients)
  const patients = useHealixStore((s) => s.patients)
  const addClient = useHealixStore((s) => s.addClient)
  const deleteClient = useHealixStore((s) => s.deleteClient)

  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<AddClientForm>({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    partnershipStartDate: todayISO(),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.name, c.industry, c.contactPerson].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  }, [clients, query])

  const patientsByClientId = useMemo(() => {
    return patients.reduce<Record<string, number>>((acc, p) => {
      acc[p.clientId] = (acc[p.clientId] ?? 0) + 1
      return acc
    }, {})
  }, [patients])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          Clients
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="w-full md:w-[320px]">
            <Input
              placeholder="Search clients…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>+ Add Client</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            registeredPatients={patientsByClientId[client.id] ?? 0}
            onDelete={() => deleteClient(client.id)}
          />
        ))}
      </div>

      <Modal
        open={addOpen}
        title="Add Client"
        description="Create a new corporate partner profile."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const brandColor = '#00C9B1'
                addClient({
                  name: form.name.trim() || 'New Client',
                  industry: form.industry.trim() || 'Industry',
                  contactPerson: form.contactPerson.trim() || 'Contact',
                  email: form.email.trim() || 'contact@example',
                  phone: form.phone.trim() || '+968',
                  partnershipStartDate: new Date(
                    form.partnershipStartDate,
                  ).toISOString(),
                  status: 'active',
                  brandColor,
                })
                setAddOpen(false)
                setForm({
                  name: '',
                  industry: '',
                  contactPerson: '',
                  email: '',
                  phone: '',
                  partnershipStartDate: todayISO(),
                })
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Company Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Industry"
            value={form.industry}
            onChange={(e) =>
              setForm((s) => ({ ...s, industry: e.target.value }))
            }
          />
          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(e) =>
              setForm((s) => ({ ...s, contactPerson: e.target.value }))
            }
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          />
          <Input
            label="Partnership Start Date"
            type="date"
            value={form.partnershipStartDate}
            onChange={(e) =>
              setForm((s) => ({ ...s, partnershipStartDate: e.target.value }))
            }
          />
        </div>
      </Modal>
    </div>
  )
}

