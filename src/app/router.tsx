import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ClientProfilePage } from '../pages/ClientProfilePage'
import { PatientsPage } from '../pages/PatientsPage'
import { PatientProfilePage } from '../pages/PatientProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientProfilePage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:id', element: <PatientProfilePage /> },
    ],
  },
])

