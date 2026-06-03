import {
  Activity,
  BarChart3,
  Building2,
  Layers,
  MapPin,
  Phone,
  Stethoscope,
  Target,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/ui/Button'
import {
  computeDashboardAnalytics,
  formatMinutes,
  type DashboardFilters,
  type DashboardPeriod,
} from '../lib/dashboardAnalytics'
import { OMAN_ZONES } from '../mock/constants'
import { useHealixStore } from '../store/useHealixStore'
import type { ID, Zone } from '../types'

const PERIODS: { label: string; value: DashboardPeriod }[] = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: 'All', value: 'all' },
]

const CHART_TOOLTIP = {
  borderRadius: 16,
  border: '1px solid rgba(15, 23, 42, 0.08)',
}

export function DashboardPage() {
  const patients = useHealixStore((s) => s.patients)
  const clients = useHealixStore((s) => s.clients)
  const hospitals = useHealixStore((s) => s.hospitals)
  const doctors = useHealixStore((s) => s.doctors)
  const appointments = useHealixStore((s) => s.appointments)
  const conversationsByPatientId = useHealixStore((s) => s.conversationsByPatientId)
  const timelineByPatientId = useHealixStore((s) => s.timelineByPatientId)

  const [filters, setFilters] = useState<DashboardFilters>({
    period: 30,
    zone: 'all',
    clientId: 'all',
  })

  const analytics = useMemo(
    () =>
      computeDashboardAnalytics(
        patients,
        clients,
        hospitals,
        doctors,
        appointments,
        conversationsByPatientId,
        timelineByPatientId,
        filters,
      ),
    [
      patients,
      clients,
      hospitals,
      doctors,
      appointments,
      conversationsByPatientId,
      timelineByPatientId,
      filters,
    ],
  )

  const { kpis } = analytics

  const callMixData = useMemo(
    () => [
      { name: 'AI intake', value: kpis.aiCallsInPeriod, fill: '#00C9B1' },
      { name: 'Case manager', value: kpis.cmCallsInPeriod, fill: '#0B1628' },
    ],
    [kpis.aiCallsInPeriod, kpis.cmCallsInPeriod],
  )

  const hospitalCapacity = useMemo(() => {
    const map = new Map<
      string,
      { doctors: number; availableThisWeek: number; bookings: number }
    >()
    for (const row of analytics.doctorSupply) {
      map.set(row.hospital, {
        doctors: row.doctors,
        availableThisWeek: row.availableThisWeek,
        bookings: 0,
      })
    }
    for (const { name, value } of analytics.hospitals) {
      const cur = map.get(name) ?? {
        doctors: 0,
        availableThisWeek: 0,
        bookings: 0,
      }
      cur.bookings = value
      map.set(name, cur)
    }
    return [...map.entries()]
      .map(([hospital, v]) => ({
        hospital,
        ...v,
      }))
      .sort((a, b) => b.doctors - a.doctors)
  }, [analytics.doctorSupply, analytics.hospitals])

  const insights = useMemo(() => {
    const lines: string[] = []
    const topSym = analytics.symptoms[0]
    const topZone = analytics.zones[0]
    const topDept = analytics.departments[0]

    if (kpis.urgentActiveUnbooked > 0) {
      lines.push(
        `${kpis.urgentActiveUnbooked} active urgent patient(s) still need a confirmed booking — prioritize case manager outreach and hospital slot availability.`,
      )
    }
    if (topSym && topDept) {
      lines.push(
        `Top reported symptoms (${topSym.name}) align with routing to ${topDept.name} — validate wait times and capacity for that pathway.`,
      )
    } else if (topSym) {
      lines.push(
        `Most frequent intake symptom is ${topSym.name} — review triage scripts and downstream specialty coverage.`,
      )
    }
    if (topZone && kpis.callsInPeriod > 0) {
      lines.push(
        `${topZone.name} carries the largest share of registered patients in this cohort (${topZone.value}) — compare with intake zone demand and hospital placement.`,
      )
    }
    if (
      kpis.navigatedPatientsEver > 0 &&
      kpis.bookingConversionPct < 60 &&
      kpis.bookingConversionPct > 0
    ) {
      lines.push(
        `Booking conversion among patients who have had at least one call is ${kpis.bookingConversionPct}% — investigate handoffs from AI intake to case managers and slot inventory.`,
      )
    }
    if (lines.length === 0) {
      lines.push(
        'Adjust filters or record more calls and bookings to surface richer product and operations insights.',
      )
    }
    return lines.slice(0, 4)
  }, [analytics.departments, analytics.symptoms, analytics.zones, kpis])

  const partnerSorted = useMemo(
    () => [...analytics.partnerRows].sort((a, b) => b.callsInPeriod - a.callsInPeriod),
    [analytics.partnerRows],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Navigation analytics
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Operational and product metrics for Healix: call mix, geography, partner
            performance, routing themes, and booking outcomes. Data is derived from the
            in-browser mock store (patients, conversations, timeline, and appointments).
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:min-w-[280px]">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time window
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <Button
                key={String(p.value)}
                type="button"
                size="sm"
                variant={filters.period === p.value ? 'primary' : 'secondary'}
                onClick={() => setFilters((f) => ({ ...f, period: p.value }))}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Zone
              </label>
              <select
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus-visible:ring-2 focus-visible:ring-healix-teal/20"
                value={filters.zone === 'all' ? '' : filters.zone}
                onChange={(e) => {
                  const v = e.target.value
                  setFilters((f) => ({
                    ...f,
                    zone: v === '' ? 'all' : (v as Zone),
                  }))
                }}
              >
                <option value="">All zones</option>
                {OMAN_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Partner
              </label>
              <select
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus-visible:ring-2 focus-visible:ring-healix-teal/20"
                value={filters.clientId === 'all' ? '' : filters.clientId}
                onChange={(e) => {
                  const v = e.target.value
                  setFilters((f) => ({
                    ...f,
                    clientId: v === '' ? 'all' : (v as ID),
                  }))
                }}
              >
                <option value="">All partners</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Cohort: {analytics.rangeLabel}
            {filters.zone !== 'all' ? ` · ${filters.zone}` : ''}
            {filters.clientId !== 'all'
              ? ` · ${clients.find((c) => c.id === filters.clientId)?.name ?? 'Partner'}`
              : ''}
          </div>
        </div>
      </div>

      <div className="healix-card border-l-4 border-l-healix-teal px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Target className="h-4 w-4 text-healix-teal" aria-hidden />
          Analyst notes
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
          {insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patients in cohort"
          value={kpis.totalPatients}
          hint={`${kpis.activePatients} active`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="New registrations"
          value={kpis.newRegistrationsInPeriod}
          hint={analytics.rangeLabel}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Calls in window"
          value={kpis.callsInPeriod}
          hint={`${kpis.patientsTouchedInPeriod} patients touched`}
          icon={<Phone className="h-5 w-5" />}
        />
        <StatCard
          label="Avg call length"
          value={formatMinutes(kpis.avgCallDurationMinutes)}
          hint="AI + case manager"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          label="AI share"
          value={kpis.callsInPeriod ? `${kpis.aiSharePct}%` : '—'}
          hint={`${kpis.aiCallsInPeriod} AI · ${kpis.cmCallsInPeriod} CM`}
          icon={<Layers className="h-5 w-5" />}
        />
        <StatCard
          label="Booking conversion"
          value={
            kpis.navigatedPatientsEver
              ? `${kpis.bookingConversionPct}%`
              : '—'
          }
          hint="Share of patients with any call who have a booking"
          icon={<Stethoscope className="h-5 w-5" />}
        />
        <StatCard
          label="Booked patients (cohort)"
          value={kpis.bookedPatientsEver}
          hint="CRM appointments or timeline confirmation"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Urgent · active · unbooked"
          value={kpis.urgentActiveUnbooked}
          hint="Needs navigation completion"
          icon={<MapPin className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">Call volume by week</div>
          <div className="mt-1 text-sm text-slate-500">
            AI vs case manager conversations in the selected window (cohort-filtered).
          </div>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {analytics.weeklyCalls.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No calls in this period for the current filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyCalls}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,201,177,0.06)' }} contentStyle={CHART_TOOLTIP} />
                  <Legend />
                  <Bar dataKey="ai" name="AI" stackId="a" fill="#00C9B1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cm" name="Case manager" stackId="a" fill="#0B1628" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">Call mix</div>
          <div className="mt-1 text-sm text-slate-500">
            Balance between automated intake and human navigation for the window.
          </div>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {kpis.callsInPeriod === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No calls to chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callMixData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {callMixData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">Patients by home zone</div>
          <div className="mt-1 text-sm text-slate-500">Where registered patients live (cohort).</div>
          <div className="mt-4 h-[320px] w-full min-w-0">
            {analytics.zones.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No patients match filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={analytics.zones} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,201,177,0.06)' }} contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="value" name="Patients" fill="#00C9B1" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">Intake zone (calls in window)</div>
          <div className="mt-1 text-sm text-slate-500">
            Zone captured on case forms during calls; falls back to patient zone.
          </div>
          <div className="mt-4 h-[320px] w-full min-w-0">
            {analytics.intakeZones.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No intake geography in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={analytics.intakeZones} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,201,177,0.06)' }} contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="value" name="Call mentions" fill="#0B1628" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">Symptoms (intake)</div>
          <div className="mt-1 text-sm text-slate-500">
            Frequency in conversations during the window — guides triage and hospital routing.
          </div>
          <div className="mt-4 h-[300px] w-full min-w-0">
            {analytics.symptoms.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No symptom data in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.symptoms} margin={{ bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={72}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,201,177,0.06)' }} contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="value" fill="#00C9B1" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="healix-card p-5">
          <div className="text-base font-semibold text-slate-900">AI routing · department</div>
          <div className="mt-1 text-sm text-slate-500">
            Departments suggested by intake recommendations (when present).
          </div>
          <div className="mt-4 h-[300px] w-full min-w-0">
            {analytics.departments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No AI department tags in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={analytics.departments} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,201,177,0.06)' }} contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="value" fill="#64748b" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="healix-card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-base font-semibold text-slate-900">Partner performance</div>
            <div className="mt-1 text-sm text-slate-500">
              Calls in the window and booking conversion among patients who have ever called.
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Partner</th>
                  <th className="px-6 py-3">Patients</th>
                  <th className="px-6 py-3">Calls</th>
                  <th className="px-6 py-3">Navigated</th>
                  <th className="px-6 py-3">Booked</th>
                  <th className="px-6 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partnerSorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No partner activity for these filters.
                    </td>
                  </tr>
                ) : (
                  partnerSorted.map((row) => (
                    <tr key={row.clientId} className="text-slate-700">
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">{row.clientName}</div>
                        <div className="text-xs text-slate-500">
                          {row.active ? 'Active partnership' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {row.patients}
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-500">{row.activePatients} active</span>
                      </td>
                      <td className="px-6 py-3">{row.callsInPeriod}</td>
                      <td className="px-6 py-3">{row.navigatedPatients}</td>
                      <td className="px-6 py-3">{row.bookedPatients}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {row.navigatedPatients ? `${row.bookingRate}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="healix-card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-base font-semibold text-slate-900">Hospital network</div>
            <div className="mt-1 text-sm text-slate-500">
              Doctor bench strength and CRM-recorded bookings for the filtered patient cohort.
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Hospital</th>
                  <th className="px-6 py-3">Doctors</th>
                  <th className="px-6 py-3">Available this week</th>
                  <th className="px-6 py-3">Bookings (cohort)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hospitalCapacity.map((row) => (
                  <tr key={row.hospital} className="text-slate-700">
                    <td className="px-6 py-3 font-medium text-slate-900">{row.hospital}</td>
                    <td className="px-6 py-3">{row.doctors}</td>
                    <td className="px-6 py-3">{row.availableThisWeek}</td>
                    <td className="px-6 py-3">{row.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="healix-card p-5">
        <div className="text-base font-semibold text-slate-900">Priority mix (cohort)</div>
        <div className="mt-1 text-sm text-slate-500">
          Current patient priority flags — useful for staffing and escalation rules.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {analytics.priorities.length === 0 ? (
            <span className="text-sm text-slate-500">No patients in cohort.</span>
          ) : (
            analytics.priorities.map((p) => (
              <div
                key={p.name}
                className="flex min-w-[140px] flex-1 flex-col rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {p.name}
                </span>
                <span className="mt-1 text-2xl font-semibold text-slate-900">{p.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
