import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { ChatPage } from './pages/ChatPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"       element={<DashboardPage />} />
            <Route path="/leads"  element={<LeadsPage />} />
            <Route path="/chat"   element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
