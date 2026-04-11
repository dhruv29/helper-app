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

// Per-state config for the ONE big Sarah button
const SARAH_STATES = {
  idle: {
    bg: '#4F46E5',
    glow: 'rgba(79, 70, 229, 0.38)',
    icon: '🎙️',
    action: 'Talk to Sarah',
    hint: 'Tap to begin',
    pulse: false,
  },
  listening: {
    bg: '#DC2626',
    glow: 'rgba(220, 38, 38, 0.42)',
    icon: '🎙️',
    action: 'Sarah is listening',
    hint: 'Tap to stop',
    pulse: true,
  },
  thinking: {
    bg: '#D97706',
    glow: 'rgba(217, 119, 6, 0.42)',
    icon: '✨',
    action: 'Sarah is thinking',
    hint: null,
    pulse: true,
  },
  speaking: {
    bg: '#059669',
    glow: 'rgba(5, 150, 105, 0.42)',
    icon: '🔊',
    action: 'Sarah is speaking',
    hint: 'Tap to stop',
    pulse: false,
  },
  error: {
    bg: '#DC2626',
    glow: 'rgba(220, 38, 38, 0.3)',
    icon: '🔄',
    action: 'Something went wrong',
    hint: 'Tap to try again',
    pulse: false,
  },
}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'talk',     icon: '💬', label: 'Talk to Sarah' },
    { id: 'history',  icon: '📋', label: 'History'       },
    { id: 'upcoming', icon: '📅', label: 'Upcoming'      },
  ]
  return (
    <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
      <div className="max-w-7xl mx-auto px-8 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-7 py-4 font-semibold text-sm transition-colors ${
              tab === t.id ? 'text-helper-blue' : 'text-helper-gray-text hover:text-helper-navy'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>{t.label}
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
    <div className="flex gap-3 mb-7 overflow-x-auto pb-1">
      {QUICK_ACTIONS.map((qa, i) => (
        <motion.button
          key={qa.label}
          onClick={() => onAction(qa.message)}
          className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-white border border-gray-200 rounded-2xl font-semibold text-helper-navy text-sm shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xl">{qa.icon}</span>
          {qa.label}
        </motion.button>
      ))}
    </div>
  )
}

function SarahButton({ voiceState, onPress }) {
  const cfg = SARAH_STATES[voiceState] || SARAH_STATES.idle

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Name above */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-helper-gray-text font-semibold mb-1">Your companion</p>
        <h2 className="text-4xl font-black text-helper-navy">Sarah</h2>
      </div>

      {/* Outer warm glow ring — only when active */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <AnimatePresence>
          {cfg.pulse && (
            <motion.div
              className="absolute rounded-full"
              style={{ width: 240, height: 240, backgroundColor: cfg.bg }}
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: 1.45, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* The ONE button */}
        <motion.button
          onClick={onPress}
          className="relative rounded-full text-white flex flex-col items-center justify-center gap-2 select-none cursor-pointer shadow-2xl"
          style={{ width: 210, height: 210 }}
          animate={{
            backgroundColor: cfg.bg,
            boxShadow: `0 24px 64px ${cfg.glow}`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          whileHover={voiceState === 'idle' || voiceState === 'error' ? { scale: 1.05 } : {}}
          whileTap={{ scale: 0.93 }}
        >
          <motion.span
            className="text-5xl"
            key={cfg.icon}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {cfg.icon}
          </motion.span>

          <AnimatePresence mode="wait">
            <motion.span
              key={cfg.action}
              className="text-base font-black text-center leading-tight px-6"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {cfg.action}
            </motion.span>
          </AnimatePresence>

          {cfg.hint && (
            <span className="text-xs text-white/70 font-medium">{cfg.hint}</span>
          )}
        </motion.button>
      </div>

      {/* Waveform — listening */}
      <div className="h-7 flex items-center justify-center gap-1">
        <AnimatePresence>
          {voiceState === 'listening' && (
            <>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <motion.div
                  key={i}
                  className="wave-bar w-1.5 bg-helper-red rounded-full"
                  style={{ animationDelay: `${(i - 1) * 0.1}s` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
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
  const [tab, setTab]               = useState('talk')
  const [voiceState, setVoiceState] = useState('idle')
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencySent, setEmergencySent] = useState(false)
  const vcRef = useRef(null)

  const handleQuickAction = (message) => {
    setTab('talk')
    setTimeout(() => vcRef.current?.triggerMessage(message), 80)
  }

  const handleEmergency = () => {
    if (emergencySent) return
    setEmergencySent(true)
    onAlert?.({
      type: 'high',
      title: '🚨 EMERGENCY ALERT',
      msg: 'Your parent pressed the emergency button. Contacting caregivers now.',
      icon: '🚨',
    })
    setTimeout(() => setShowEmergency(false), 3000)
    setTimeout(() => setEmergencySent(false), 6000)
  }

  return (
    <div className="min-h-screen bg-helper-gray-light">
      <TabBar tab={tab} setTab={setTab} />

      <div className="max-w-7xl mx-auto px-8 py-8">
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
              <QuickActions onAction={handleQuickAction} />

              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Sarah button — top of the card */}
                  <div className="flex flex-col items-center pt-10 pb-6 px-8">
                    <SarahButton
                      voiceState={voiceState}
                      onPress={() => vcRef.current?.triggerVoice()}
                    />
                  </div>

                  {/* Conversation — flows directly below Sarah */}
                  <div className="border-t border-gray-100">
                    <VoiceConnect
                      ref={vcRef}
                      onAlert={onAlert}
                      mode="senior"
                      onStateChange={setVoiceState}
                      compact
                    />
                  </div>

                  {/* Emergency — bottom of card */}
                  <div className="px-8 pb-8 pt-2">
                    <AnimatePresence mode="wait">
                      {!showEmergency ? (
                        <motion.button
                          key="emer-btn"
                          onClick={() => setShowEmergency(true)}
                          className="btn-emergency w-full"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-3xl">🆘</span>
                          <span>Emergency Help</span>
                        </motion.button>
                      ) : (
                        <motion.div
                          key="emer-confirm"
                          className="space-y-3"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <div className="card border-4 border-helper-red text-center py-4 px-5">
                            <p className="font-black text-helper-red text-base">Send emergency alert?</p>
                            <p className="text-xs text-helper-gray-text mt-1">Your caregivers will be notified immediately</p>
                          </div>
                          <button
                            onClick={handleEmergency}
                            disabled={emergencySent}
                            className={`btn-emergency w-full ${emergencySent ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <span className="text-2xl">{emergencySent ? '✅' : '🆘'}</span>
                            <span>{emergencySent ? 'Alert Sent!' : 'YES — Send Alert'}</span>
                          </button>
                          {!emergencySent && (
                            <button onClick={() => setShowEmergency(false)} className="btn-outline w-full">Cancel</button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
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
