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

        {/* Desktop nav buttons — hidden on mobile */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => setView(VIEWS.SENIOR)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.SENIOR ? 'bg-helper-blue text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Parent View
          </button>
          <button
            onClick={() => setView(VIEWS.CAREGIVER)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.CAREGIVER ? 'bg-helper-blue text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView(VIEWS.SETUP)}
            className={`px-4 py-2 rounded-xl text-elder-sm font-semibold transition-all ${
              view === VIEWS.SETUP ? 'bg-helper-blue text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Setup
          </button>
        </div>
      </nav>

      {/* Main content — extra bottom padding on mobile to clear the bottom nav */}
      <div className="pb-0 sm:pb-0 [padding-bottom:env(safe-area-inset-bottom)]">
        {view === VIEWS.SENIOR && <SeniorHome onAlert={addAlert} />}
        {view === VIEWS.CAREGIVER && <CaregiverDashboard alerts={alerts} onAlert={addAlert} />}
        {view === VIEWS.SETUP && <Setup />}
      </div>

      {/* Mobile bottom nav — hidden on sm+ */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { v: VIEWS.SENIOR,    icon: '🏠', label: 'Home'      },
          { v: VIEWS.CAREGIVER, icon: '📊', label: 'Care'      },
          { v: VIEWS.SETUP,     icon: '⚙️', label: 'Setup'     },
        ].map(({ v, icon, label }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              view === v ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl leading-none">{icon}</span>
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
            {view === v && <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full" />}
          </button>
        ))}
      </nav>

    </div>
  )
}
