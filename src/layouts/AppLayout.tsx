import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-healix-surface">
      <Sidebar />
      <main className="min-h-screen pl-[240px]">
        <div className="mx-auto max-w-[1280px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

