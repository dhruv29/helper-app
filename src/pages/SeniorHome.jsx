import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VoiceConnect from '../components/VoiceConnect'

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '🩺', label: 'Call Doctor',  message: "I'd like to reach my doctor. Can you help me with his contact number?" },
  { icon: '📬', label: 'Messages',     message: "Do I have any important messages or updates today?" },
  { icon: '⛪', label: 'Church',       message: "What time is the church service this Sunday?" },
  { icon: '💊', label: 'Medication',   message: "When do I need to take my next medication?" },
  { icon: '🎉', label: '80s Club',     message: "Tell me about my 80s Club. When is our next meeting?" },
]


const UPCOMING = {
  medications: [
    { name: 'Metformin 500mg',  time: 'Tonight · 8:00 PM',  note: 'Take with dinner' },
    { name: 'Lisinopril 10mg',  time: 'Tomorrow · 8:00 AM', note: 'Take with water'  },
  ],
  appointments: [
    { title: 'Dr. Johnson — Primary Care', date: 'Tue, Apr 14', time: '2:00 PM', icon: '🩺' },
    { title: 'Blood Panel Lab Work',       date: 'Thu, Apr 16', time: '9:00 AM', icon: '🔬' },
  ],
  community: [
    { title: '80s Club Meeting', schedule: 'Every Thursday', time: '3:00 PM',  place: 'Community Center, Room 4', icon: '🎉' },
    { title: 'Sunday Service',   schedule: 'Every Sunday',   time: '10:00 AM', place: "St. Mary's Church",       icon: '⛪' },
  ],
}

const WEATHER = {
  location: 'San Francisco, CA',
  temp: 68,
  high: 73,
  low: 57,
  condition: 'Partly Cloudy',
  icon: '⛅',
  feelsLike: 65,
}

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'family',
    from: 'Sarah (Daughter)',
    avatar: '👧',
    msg: "Hi Mom! Don't forget your 2pm appointment on Tuesday. Thinking of you, love you!",
    time: '10 min ago',
    unread: true,
  },
  {
    id: 2,
    type: 'government',
    from: 'Medicare Notice',
    avatar: '🏛️',
    msg: 'Your annual wellness visit is due. Please schedule with Dr. Johnson before June 30th.',
    time: '2 hrs ago',
    unread: true,
  },
  {
    id: 3,
    type: 'community',
    from: 'Oakwood Community',
    avatar: '🏘️',
    msg: 'Pool hours change from May 1st: 7am–8pm daily. Free swim for all residents aged 60+.',
    time: 'Yesterday',
    unread: false,
  },
]

const NEXT_REMINDER = {
  time: 'Tonight · 8:00 PM',
  title: 'Metformin 500mg',
  note: 'Take with dinner',
  icon: '💊',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WeatherCard() {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden shadow-sm border border-sky-100"
      style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-sky-600 mb-1">{WEATHER.location}</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-sky-900 leading-none">{WEATHER.temp}°</span>
            <span className="text-sky-700 font-semibold text-sm mb-1">{WEATHER.condition}</span>
          </div>
          <p className="text-xs text-sky-600 mt-1.5 font-medium">
            H:{WEATHER.high}°  L:{WEATHER.low}°  &nbsp;·&nbsp; Feels like {WEATHER.feelsLike}°
          </p>
        </div>
        <span className="text-6xl">{WEATHER.icon}</span>
      </div>
    </motion.div>
  )
}

const TYPE_STYLES = {
  family:     { bg: 'bg-indigo-50', border: 'border-indigo-100', badge: 'bg-indigo-100 text-indigo-700', label: 'Family'     },
  government: { bg: 'bg-blue-50',   border: 'border-blue-100',   badge: 'bg-blue-100 text-blue-700',     label: 'Official'   },
  community:  { bg: 'bg-green-50',  border: 'border-green-100',  badge: 'bg-green-100 text-green-700',   label: 'Community'  },
}

function NotificationsCard() {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
    >
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">🔔</span>
        <p className="font-black text-helper-navy text-sm">Notifications</p>
        <span className="ml-auto bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {NOTIFICATIONS.filter(n => n.unread).length} new
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {NOTIFICATIONS.map((item, i) => {
          const s = TYPE_STYLES[item.type]
          return (
            <motion.div
              key={item.id}
              className={`px-5 py-4 flex items-start gap-3 ${item.unread ? s.bg : ''} transition-colors cursor-pointer`}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.04 }}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 border ${s.border} ${s.bg}`}>
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-helper-navy text-sm leading-tight">{item.from}</p>
                  {item.unread && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>{s.label}</span>
                </div>
                <p className="text-sm text-gray-600 leading-snug">{item.msg}</p>
                <p className="text-xs text-gray-400 mt-1">{item.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function ReminderCard() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <motion.div
      className="rounded-2xl border border-amber-200 overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
    >
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
          {NEXT_REMINDER.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Next Reminder</p>
          <p className="font-black text-amber-900 text-sm leading-tight">{NEXT_REMINDER.title}</p>
          <p className="text-xs text-amber-700 mt-0.5">{NEXT_REMINDER.time} &nbsp;·&nbsp; {NEXT_REMINDER.note}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'talk',     icon: '💬', label: 'Talk to Sarah' },
    { id: 'history',  icon: '📋', label: 'History'       },
    { id: 'upcoming', icon: '📅', label: 'Upcoming'      },
  ]
  return (
    <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-8 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 sm:flex-none px-3 sm:px-7 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-colors ${
              tab === t.id ? 'text-helper-blue' : 'text-helper-gray-text hover:text-helper-navy'
            }`}
          >
            <span className="mr-1">{t.icon}</span>{t.label}
            {tab === t.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-helper-blue rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function QuickActions({ onAction }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
      {QUICK_ACTIONS.map((qa, i) => (
        <motion.button
          key={qa.label}
          onClick={() => onAction(qa.message)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full font-semibold text-helper-navy text-sm shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-base">{qa.icon}</span>
          {qa.label}
        </motion.button>
      ))}
    </div>
  )
}


function HistoryTab() {
  const [sessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('helper_history') || '[]') }
    catch { return [] }
  })
  const [expanded, setExpanded] = useState(null)

  if (sessions.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-28 text-center"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-7xl mb-5">💬</div>
        <h2 className="text-2xl font-black text-helper-navy mb-2">No conversations yet</h2>
        <p className="text-helper-gray-text">Your chats with Sarah will appear here</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="max-w-2xl space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-black text-helper-navy mb-6">Conversation History</h2>
      {sessions.map((session, si) => (
        <motion.div
          key={session.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.05 }}
          onClick={() => setExpanded(expanded === session.id ? null : session.id)}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="font-bold text-helper-navy">
                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-helper-gray-text mt-0.5">
                {session.exchanges.length} exchange{session.exchanges.length !== 1 ? 's' : ''}
              </p>
            </div>
            <motion.span className="text-xs text-helper-gray-text font-semibold" animate={{ rotate: expanded === session.id ? 180 : 0 }}>▼</motion.span>
          </div>

          <AnimatePresence>
            {expanded === session.id && (
              <motion.div
                className="border-t border-gray-100 px-6 py-5 space-y-4 bg-gray-50"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {session.exchanges.map((ex, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-helper-navy text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                        <p className="text-sm">{ex.user}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-black text-xs">S</div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%] shadow-sm">
                        <p className="text-sm text-helper-navy">{ex.sarah}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  )
}

function UpcomingTab() {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-helper-navy mb-4 flex items-center gap-2 text-lg"><span>💊</span> Medications</h3>
        <div className="space-y-3">
          {UPCOMING.medications.map((med, i) => (
            <motion.div key={i} className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100" whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}>
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm text-white text-lg">💊</div>
              <div>
                <p className="font-bold text-helper-navy text-sm">{med.name}</p>
                <p className="text-indigo-600 font-semibold text-sm mt-0.5">{med.time}</p>
                <p className="text-helper-gray-text text-xs mt-0.5">{med.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-helper-navy mb-4 flex items-center gap-2 text-lg"><span>📅</span> Appointments</h3>
        <div className="space-y-3">
          {UPCOMING.appointments.map((apt, i) => (
            <motion.div key={i} className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100" whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}>
              <span className="text-3xl">{apt.icon}</span>
              <div>
                <p className="font-bold text-helper-navy text-sm">{apt.title}</p>
                <p className="text-helper-green font-semibold text-sm mt-0.5">{apt.date} · {apt.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="font-black text-helper-navy mb-4 flex items-center gap-2 text-lg"><span>🤝</span> Community & Activities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {UPCOMING.community.map((evt, i) => (
            <motion.div key={i} className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100" whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">{evt.icon}</div>
              <div>
                <p className="font-bold text-helper-navy">{evt.title}</p>
                <p className="text-purple-700 font-semibold text-sm">{evt.schedule} · {evt.time}</p>
                <p className="text-helper-gray-text text-xs mt-0.5">{evt.place}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SeniorHome({ onAlert }) {
  const [tab, setTab]           = useState('talk')
  const [sosConfirm, setSosConfirm] = useState(false)
  const [sosSent, setSosSent]   = useState(false)
  const vcRef = useRef(null)

  const handleQuickAction = (message) => {
    setTab('talk')
    setTimeout(() => vcRef.current?.triggerMessage(message), 80)
  }

  const handleSos = () => {
    if (sosSent) return
    setSosSent(true)
    onAlert?.({ type: 'high', title: '🚨 EMERGENCY ALERT', msg: 'Emergency button pressed. Contacting caregivers now.', icon: '🚨' })
    setTimeout(() => { setSosConfirm(false); setSosSent(false) }, 4000)
  }

  return (
    <div className="min-h-screen bg-helper-gray-light">
      <TabBar tab={tab} setTab={setTab} />

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pb-6">
        <AnimatePresence mode="wait">

          {/* ── TALK TAB ─────────────────────────────────────────────── */}
          {tab === 'talk' && (
            <motion.div
              key="talk"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
            >
              {/* Quick action pills */}
              <div className="mb-3">
                <QuickActions onAction={handleQuickAction} />
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    S
                  </div>
                  <div>
                    <p className="font-black text-helper-navy text-base leading-tight">Sarah</p>
                    <p className="text-xs text-emerald-500 font-semibold">● Online</p>
                  </div>
                  <button
                    onClick={() => setSosConfirm(v => !v)}
                    className="ml-auto w-10 h-10 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-md hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <span className="text-[10px] font-black leading-none tracking-wide">SOS</span>
                  </button>
                </div>

                {/* SOS confirm panel */}
                <AnimatePresence>
                  {sosConfirm && (
                    <motion.div
                      className="px-5 py-4 bg-red-50 border-b border-red-100"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="font-black text-red-600 text-sm mb-0.5">Send emergency alert?</p>
                      <p className="text-xs text-gray-500 mb-3">Your caregivers will be notified immediately.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSos}
                          disabled={sosSent}
                          className="flex-1 bg-red-600 text-white text-sm font-bold py-2 rounded-xl disabled:opacity-60 transition-opacity"
                        >
                          {sosSent ? 'Sent ✓' : 'Yes, Send'}
                        </button>
                        <button
                          onClick={() => setSosConfirm(false)}
                          className="flex-1 bg-white text-gray-700 text-sm font-bold py-2 rounded-xl border border-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat + controls */}
                <VoiceConnect
                  ref={vcRef}
                  onAlert={onAlert}
                  mode="senior"
                  compact
                />

              </div>

              {/* Weather + News + Reminder */}
              <div className="mt-4 space-y-3">
                <ReminderCard />
                <WeatherCard />
                <NotificationsCard />
              </div>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HistoryTab />
            </motion.div>
          )}

          {tab === 'upcoming' && (
            <motion.div key="upcoming" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <UpcomingTab />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
