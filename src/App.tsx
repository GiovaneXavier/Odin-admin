import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/pages/Dashboard'
import { Employees } from '@/pages/Employees'
import { Systems } from '@/pages/Systems'
import { QRGenerator } from '@/pages/QRGenerator'
import { QRHistory } from '@/pages/QRHistory'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#0f1117]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/employees"    element={<Employees />} />
              <Route path="/systems"      element={<Systems />} />
              <Route path="/qr-generator" element={<QRGenerator />} />
              <Route path="/qr-history"   element={<QRHistory />} />
              <Route path="/settings"     element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
