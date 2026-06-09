import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { SettingsLayout } from '../layouts/SettingsLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ClientProfilePage } from '../pages/ClientProfilePage'
import { BenchPage } from '../pages/BenchPage'
import { PatientsPage } from '../pages/PatientsPage'
import { PatientProfilePage } from '../pages/PatientProfilePage'
import { HospitalsPage } from '../pages/HospitalsPage'
import { DoctorsPage } from '../pages/DoctorsPage'
import { DoctorProfilePage } from '../pages/DoctorProfilePage'
import { SettingsPage } from '../pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientProfilePage /> },
      { path: 'hospitals', element: <HospitalsPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'doctors/:id', element: <DoctorProfilePage /> },
      { path: 'bench', element: <BenchPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:id', element: <PatientProfilePage /> },
    ],
  },
  {
    path: '/settings',
    element: <SettingsLayout />,
    children: [{ index: true, element: <SettingsPage /> }],
  },
])

