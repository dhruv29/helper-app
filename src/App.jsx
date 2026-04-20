import { useState } from 'react'
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import SeniorHome from './pages/SeniorHome'
import CaregiverDashboard from './pages/CaregiverDashboard'
import Setup from './pages/Setup'
import Login from './pages/Login'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const VIEWS = { SENIOR: 'senior', CAREGIVER: 'caregiver', SETUP: 'setup' }

const hasProfile = () => {
  try { return !!localStorage.getItem('helper_profile') } catch { return false }
}

function AppShell() {
  const { isLoaded } = useUser()
  const [view, setView] = useState(() => hasProfile() ? VIEWS.SENIOR : VIEWS.SETUP)
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'high',   time: '2 min ago', title: 'Scam Call Blocked',    msg: 'Blocked call impersonating Medicare. Your parent was not charged.', icon: '🛡️' },
    { id: 2, type: 'medium', time: '1 hr ago',  title: 'Unusual Transaction',  msg: '$450 wire transfer flagged — awaiting your review.',                icon: '💳' },
  ])

  const addAlert = (alert) =>
    setAlerts(prev => [{ ...alert, id: Date.now(), time: 'just now' }, ...prev])

  const handleSetupDone = (data) => {
    setView(data?.view === 'caregiver' ? VIEWS.CAREGIVER : VIEWS.SENIOR)
  }

  if (!isLoaded) return null

  if (view === VIEWS.SETUP) {
    return <Setup onDone={handleSetupDone} />
  }

  return (
    <div className="min-h-screen" style={{ background: '#EDE8DF' }}>

      {/* Top nav */}
      <nav className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ background: '#1C1917' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-lora text-lg font-medium" style={{ color: '#EDE8DF' }}>helper</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-1">
          {[
            { v: VIEWS.SENIOR,    label: 'Parent View' },
            { v: VIEWS.CAREGIVER, label: 'Dashboard'   },
            { v: VIEWS.SETUP,     label: 'Setup'       },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: view === v ? 'rgba(237,232,223,.15)' : 'transparent',
                color:      view === v ? '#EDE8DF' : 'rgba(237,232,223,.45)',
                border:     view === v ? '1px solid rgba(237,232,223,.2)' : '1px solid transparent',
              }}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {view === VIEWS.SENIOR    && <SeniorHome onAlert={addAlert} />}
        {view === VIEWS.CAREGIVER && <CaregiverDashboard alerts={alerts} onAlert={addAlert} />}
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: '#1C1917', borderColor: 'rgba(237,232,223,.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { v: VIEWS.SENIOR,    icon: '🏠', label: 'Home'  },
          { v: VIEWS.CAREGIVER, icon: '📊', label: 'Care'  },
          { v: VIEWS.SETUP,     icon: '⚙️', label: 'Setup' },
        ].map(({ v, icon, label }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
            style={{ color: view === v ? '#EDE8DF' : 'rgba(237,232,223,.35)' }}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

export default function App() {
  if (!CLERK_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: '#EDE8DF', fontFamily: 'DM Sans, sans-serif' }}>
        <div className="max-w-sm text-center">
          <p className="text-4xl mb-4">🔑</p>
          <p className="font-lora text-xl font-medium mb-2" style={{ color: '#1C1917' }}>Clerk not configured</p>
          <p className="text-sm leading-relaxed" style={{ color: '#7A7269' }}>
            Add <code className="px-1 py-0.5 rounded text-xs" style={{ background: '#E8E2DA', color: '#1C1917' }}>VITE_CLERK_PUBLISHABLE_KEY</code> to your <code className="px-1 py-0.5 rounded text-xs" style={{ background: '#E8E2DA', color: '#1C1917' }}>.env</code> file.
            Get it from <strong>clerk.com → your app → API Keys</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <SignedOut>
        <Login />
      </SignedOut>
      <SignedIn>
        <AppShell />
      </SignedIn>
    </ClerkProvider>
  )
}
