import { useState, useEffect, useRef } from 'react'
import { ClerkProvider, SignedIn, SignedOut, useUser, useClerk, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { Logo } from './components/Logo'
import SeniorHome from './pages/SeniorHome'
import CaregiverDashboard from './pages/CaregiverDashboard'
import Setup from './pages/Setup'
import Landing from './pages/Landing'
import { api } from './lib/api.js'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const VIEWS = { SENIOR: 'senior', CAREGIVER: 'caregiver', SETUP: 'setup' }

const profileKey = (userId) => `helper_profile_${userId}`
const hasProfile = (userId) => {
  try { return !!localStorage.getItem(profileKey(userId)) } catch { return false }
}

const DEMO_PROFILES = {
  'dhruv.mait@gmail.com': {
    caregiverName: 'Dhruv',
    relationship:  'Son',
    parentName:    'Vijay Kumar Gupta',
    parentAge:     '78',
    parentCity:    'Delhi, India',
    healthNotes:   'Hip pain, takes blood pressure medication. Moves slowly in the mornings.',
    interests:     ['Family photos', 'Gardening', 'TV shows', 'Cooking', 'Grandchildren'],
    extraInterests: 'Loves cooking traditional recipes and watching nature documentaries.',
    medications: [
      { name: 'Metformin',   dose: '500mg', schedule: 'Morning' },
      { name: 'Lisinopril',  dose: '10mg',  schedule: 'Morning' },
      { name: 'Atorvastatin', dose: '20mg', schedule: 'Evening' },
    ],
    emergencyName:  'James Chen',
    emergencyPhone: '+1 (555) 000-0000',
    notifyVia:      'dashboard',
  },
}

function AppShell() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const [view, setView] = useState(null)
  const setupCalledRef = useRef(null)  // tracks which userId we've already seeded
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'high',   time: '2 min ago', title: 'Scam Call Blocked',    msg: 'Blocked call impersonating Medicare. Your parent was not charged.', icon: '🛡️' },
    { id: 2, type: 'medium', time: '1 hr ago',  title: 'Unusual Transaction',  msg: '$450 wire transfer flagged — awaiting your review.',                icon: '💳' },
  ])

  useEffect(() => {
    if (!isLoaded || !user) return
    const raw = localStorage.getItem(profileKey(user.id))

    if (!raw) {
      if (setupCalledRef.current === user.id) return  // already in progress
      setupCalledRef.current = user.id

      const email = user.emailAddresses?.[0]?.emailAddress
      const demo  = DEMO_PROFILES[email]
      if (demo) {
        // Known demo account — skip onboarding, seed directly
        api.setup({ ...demo, clerkUserId: user.id })
          .then(({ seniorId, caregiverId }) =>
            localStorage.setItem(profileKey(user.id), JSON.stringify({ ...demo, seniorId, caregiverId }))
          )
          .catch(() =>
            localStorage.setItem(profileKey(user.id), JSON.stringify(demo))
          )
          .finally(() => setView(VIEWS.SENIOR))
        return
      }
      // Any other email — go through normal onboarding with blank defaults
      setView(VIEWS.SETUP)
      return
    }

    const profile = JSON.parse(raw)
    if (profile.seniorId) { setView(VIEWS.SENIOR); return }
    api.setup(profile).then(({ seniorId, caregiverId }) => {
      localStorage.setItem(profileKey(user.id), JSON.stringify({ ...profile, seniorId, caregiverId }))
    }).catch(() => {}).finally(() => setView(VIEWS.SENIOR))
  }, [isLoaded, user])

  const addAlert = (alert) =>
    setAlerts(prev => [{ ...alert, id: Date.now(), time: 'just now' }, ...prev])

  const handleSetupDone = async (data) => {
    const nextView = data?.view === 'caregiver' ? VIEWS.CAREGIVER : VIEWS.SENIOR
    if (data?._cancel) { setView(nextView); return }
    try {
      const { seniorId, caregiverId } = await api.setup({ ...data, clerkUserId: user.id })
      localStorage.setItem(profileKey(user.id), JSON.stringify({ ...data, seniorId, caregiverId }))
    } catch {
      localStorage.setItem(profileKey(user.id), JSON.stringify(data))
    }
    setView(nextView)
  }

  if (!view) return null

  if (view === VIEWS.SETUP) {
    const existingProfile = JSON.parse(localStorage.getItem(profileKey(user.id)) || 'null')
    return <Setup onDone={handleSetupDone} existingProfile={existingProfile} />
  }

  return (
    <div className="min-h-screen" style={{ background: '#EDE8DF' }}>

      {/* Top nav */}
      <nav className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ background: '#1C1917' }}>
        <Logo size="md" dark />

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
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
          <button
            onClick={() => signOut()}
            className="ml-2 px-4 py-2 rounded-full text-sm transition-all"
            style={{ color: 'rgba(237,232,223,.45)', border: '1px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EDE8DF'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(237,232,223,.45)'}
          >Sign out</button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {view === VIEWS.SENIOR    && <SeniorHome onAlert={addAlert} profile={JSON.parse(localStorage.getItem(profileKey(user.id)) || '{}')} />}
        {view === VIEWS.CAREGIVER && <CaregiverDashboard alerts={alerts} onAlert={addAlert} profile={JSON.parse(localStorage.getItem(profileKey(user.id)) || '{}')} />}
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
        <button
          onClick={() => signOut()}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
          style={{ color: 'rgba(237,232,223,.35)' }}
        >
          <span className="text-xl leading-none">↩</span>
          <span className="text-[10px] font-semibold tracking-wide">Sign out</span>
        </button>
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

  if (window.location.pathname === '/sso-callback') {
    return (
      <ClerkProvider publishableKey={CLERK_KEY}>
        <AuthenticateWithRedirectCallback />
      </ClerkProvider>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <SignedOut>
        <Landing />
      </SignedOut>
      <SignedIn>
        <AppShell />
      </SignedIn>
    </ClerkProvider>
  )
}
