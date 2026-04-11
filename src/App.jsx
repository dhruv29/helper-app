import { useState } from 'react'
import SeniorHome from './pages/SeniorHome'
import CaregiverDashboard from './pages/CaregiverDashboard'
import Setup from './pages/Setup'

const VIEWS = { SENIOR: 'senior', CAREGIVER: 'caregiver', SETUP: 'setup' }

export default function App() {
  const [view, setView] = useState(VIEWS.SENIOR)
  const [alerts, setAlerts] = useState([
    {
      id: 1, type: 'high', time: '2 min ago',
      title: 'Scam Call Blocked',
      msg: 'Blocked call impersonating Medicare. Your parent was not charged.',
      icon: '🛡️'
    },
    {
      id: 2, type: 'medium', time: '1 hr ago',
      title: 'Unusual Transaction',
      msg: '$450 wire transfer flagged — awaiting your review.',
      icon: '💳'
    },
    {
      id: 3, type: 'low', time: '3 hrs ago',
      title: 'Medication Reminder Sent',
      msg: 'Evening medication reminder delivered successfully.',
      icon: '💊'
    }
  ])

  const addAlert = (alert) => {
    setAlerts(prev => [{ ...alert, id: Date.now(), time: 'just now' }, ...prev])
  }

  return (
    <div className="min-h-screen bg-helper-gray-light">
      {/* Top nav */}
      <nav className="bg-helper-navy text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="text-elder-lg font-black tracking-tight">Helper</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView(VIEWS.SENIOR)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.SENIOR
                ? 'bg-helper-blue text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Parent View
          </button>
          <button
            onClick={() => setView(VIEWS.CAREGIVER)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.CAREGIVER
                ? 'bg-helper-blue text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView(VIEWS.SETUP)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.SETUP
                ? 'bg-helper-blue text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Setup
          </button>
        </div>
      </nav>

      {/* Main content */}
      {view === VIEWS.SENIOR && <SeniorHome onAlert={addAlert} />}
      {view === VIEWS.CAREGIVER && <CaregiverDashboard alerts={alerts} onAlert={addAlert} />}
      {view === VIEWS.SETUP && <Setup />}
    </div>
  )
}
