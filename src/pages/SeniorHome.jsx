import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VoiceConnect from '../components/VoiceConnect'

// ── Static data ────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '🩺', label: 'Call Doctor',  message: "I'd like to reach my doctor. Can you help me?" },
  { icon: '📬', label: 'Messages',     message: 'Do I have any important messages today?' },
  { icon: '💊', label: 'Medication',   message: 'When do I need to take my next medication?' },
]

const UPCOMING = {
  medications: [
    { name: 'Metformin 500mg',  time: 'Tonight · 8:00 PM',  note: 'Take with dinner' },
    { name: 'Lisinopril 10mg',  time: 'Tomorrow · 8:00 AM', note: 'Take with water'  },
  ],
  appointments: [
    { title: 'Dr. Johnson — Primary Care', date: 'Tue, Apr 14', time: '2:00 PM', icon: '🩺' },
    { title: 'Blood Panel Lab Work',        date: 'Thu, Apr 16', time: '9:00 AM', icon: '🔬' },
  ],
  community: [],
}

const INITIAL_GREETING = "Good morning, Margaret. How are you feeling today?"

// ── Breathing orb ──────────────────────────────────────────────────────────────

function HelperOrb({ voiceState }) {
  const listening  = voiceState === 'listening'
  const thinking   = voiceState === 'thinking'
  const speaking   = voiceState === 'speaking'

  const glowColor = listening ? 'rgba(143,175,159,.55)' :
                    thinking  ? 'rgba(232,200,144,.45)' :
                    speaking  ? 'rgba(143,175,159,.4)'  :
                                'rgba(232,168,144,.35)'

  const coreStyle = {
    background: listening
      ? 'radial-gradient(circle at 40% 35%, rgba(200,230,210,.9) 0%, rgba(140,190,160,.75) 50%, rgba(100,160,130,.6) 100%)'
      : thinking
      ? 'radial-gradient(circle at 40% 35%, rgba(245,235,185,.9) 0%, rgba(224,200,130,.75) 50%, rgba(200,170,90,.6) 100%)'
      : 'radial-gradient(circle at 40% 35%, rgba(245,220,205,.9) 0%, rgba(224,170,148,.75) 50%, rgba(200,140,115,.6) 100%)',
    boxShadow: listening ? '0 0 40px rgba(140,190,160,.4)' :
               thinking  ? '0 0 40px rgba(224,200,130,.4)' :
                           '0 0 30px rgba(210,150,120,.3)',
  }

  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      {/* Outer ambient glow */}
      <div
        className={listening ? 'orb-pulse-glow' : 'orb-breathe-d2'}
        style={{
          position: 'absolute', inset: -48,
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(237,232,223,0) 70%)`,
          borderRadius: '50%',
        }}
      />
      {/* Middle glow */}
      <div
        className={listening ? 'orb-pulse-glow' : 'orb-breathe-d1'}
        style={{
          position: 'absolute', inset: -22,
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(237,232,223,0) 65%)`,
          borderRadius: '50%',
          opacity: .6,
        }}
      />
      {/* Outer ring */}
      <div
        className="orb-breathe-d1"
        style={{
          position: 'absolute', inset: 10,
          border: '1.5px solid rgba(200,140,110,.22)',
          borderRadius: '50%',
        }}
      />
      {/* Core */}
      <div
        className={listening ? 'orb-pulse' : 'orb-breathe'}
        style={{
          position: 'absolute', inset: 22,
          borderRadius: '50%',
          transition: 'background .6s ease, box-shadow .6s ease',
          ...coreStyle,
        }}
      />
      {/* Thinking dots overlay */}
      <AnimatePresence>
        {thinking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(200,140,100,.7)' }}
                animate={{ opacity: [.3, 1, .3], scale: [.8, 1.2, .8] }}
                transition={{ duration: .8, repeat: Infinity, delay: i * .22 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── History tab ────────────────────────────────────────────────────────────────

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
        <h2 className="font-lora text-2xl font-medium text-helper-ink mb-2">No conversations yet</h2>
        <p className="text-helper-ink-muted">Your chats with Helper will appear here</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="max-w-2xl space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-lora text-xl font-medium text-helper-ink mb-6">Conversation History</h2>
      {sessions.map((session, si) => (
        <motion.div
          key={session.id}
          className="bg-white rounded-2xl shadow-sm border border-helper-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * .05 }}
          onClick={() => setExpanded(expanded === session.id ? null : session.id)}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="font-semibold text-helper-ink">
                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-helper-ink-muted mt-0.5">
                {session.exchanges.length} exchange{session.exchanges.length !== 1 ? 's' : ''}
              </p>
            </div>
            <motion.span className="text-xs text-helper-ink-muted font-semibold" animate={{ rotate: expanded === session.id ? 180 : 0 }}>▼</motion.span>
          </div>
          <AnimatePresence>
            {expanded === session.id && (
              <motion.div
                className="border-t border-helper-border px-6 py-5 space-y-4 bg-helper-cream-mid"
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }}
              >
                {session.exchanges.map((ex, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-helper-ink text-helper-cream rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                        <p className="text-sm">{ex.user}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-helper-peach flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs">H</div>
                      <div className="bg-white border border-helper-border rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%] shadow-sm">
                        <p className="text-sm text-helper-ink">{ex.sarah}</p>
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

// ── Upcoming tab ───────────────────────────────────────────────────────────────

function UpcomingTab() {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-helper-border p-6">
        <h3 className="font-lora text-lg font-medium text-helper-ink mb-4 flex items-center gap-2">
          <span>💊</span> Medications
        </h3>
        <div className="space-y-3">
          {UPCOMING.medications.map((med, i) => (
            <motion.div key={i}
              className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100"
              whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">💊</div>
              <div>
                <p className="font-semibold text-helper-ink text-sm">{med.name}</p>
                <p className="text-amber-700 font-medium text-sm mt-0.5">{med.time}</p>
                <p className="text-helper-ink-muted text-xs mt-0.5">{med.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-helper-border p-6">
        <h3 className="font-lora text-lg font-medium text-helper-ink mb-4 flex items-center gap-2">
          <span>📅</span> Appointments
        </h3>
        <div className="space-y-3">
          {UPCOMING.appointments.map((apt, i) => (
            <motion.div key={i}
              className="flex items-center gap-4 p-4 bg-sage-50 rounded-xl border border-green-100"
              style={{ background: '#EEF5F2' }}
              whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-3xl">{apt.icon}</span>
              <div>
                <p className="font-semibold text-helper-ink text-sm">{apt.title}</p>
                <p className="text-helper-sage font-medium text-sm mt-0.5" style={{ color: '#5A8F7B' }}>
                  {apt.date} · {apt.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-helper-border p-6 lg:col-span-2">
        <h3 className="font-lora text-lg font-medium text-helper-ink mb-4 flex items-center gap-2">
          <span>🤝</span> Community &amp; Activities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {UPCOMING.community.map((evt, i) => (
            <motion.div key={i}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ background: '#F5F0F8', borderColor: '#E8D8F0' }}
              whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: '#EDD8F8' }}>{evt.icon}</div>
              <div>
                <p className="font-semibold text-helper-ink">{evt.title}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#8B5CA8' }}>
                  {evt.schedule} · {evt.time}
                </p>
                <p className="text-helper-ink-muted text-xs mt-0.5">{evt.place}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'talk',     icon: '💬', label: 'Talk to Helper' },
    { id: 'history',  icon: '📋', label: 'History'        },
    { id: 'upcoming', icon: '📅', label: 'Upcoming'       },
  ]
  return (
    <div className="border-b sticky top-[60px] z-40" style={{ background: '#EDE8DF', borderColor: '#D8D0C4' }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-8 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 sm:flex-none px-3 sm:px-7 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors ${
              tab === t.id ? 'text-helper-ink' : 'text-helper-ink-muted hover:text-helper-ink-light'
            }`}
          >
            <span className="mr-1">{t.icon}</span>{t.label}
            {tab === t.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#1C1917' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SeniorHome({ onAlert }) {
  const [tab, setTab]             = useState('talk')
  const [voiceState, setVoiceState] = useState('idle')
  const [response, setResponse]   = useState('')
  const [transcript, setTranscript] = useState('')
  const [sosConfirm, setSosConfirm] = useState(false)
  const [sosSent, setSosSent]     = useState(false)
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

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const buttonLabel =
    voiceState === 'listening' ? "I'm listening…" :
    voiceState === 'thinking'  ? 'Thinking…'       :
    voiceState === 'speaking'  ? 'Speaking…'        :
    voiceState === 'error'     ? 'Try again'        :
    "I'm here"

  const buttonBg =
    voiceState === 'listening' ? '#8FAF9F' :
    voiceState === 'thinking'  ? '#C8A060' :
    voiceState === 'speaking'  ? '#8FAF9F' :
    voiceState === 'error'     ? '#C0392B' :
    '#1C1917'

  const displayText =
    response   ? response   :
    transcript ? null       :
    INITIAL_GREETING

  return (
    <div className="min-h-screen" style={{ background: '#EDE8DF' }}>
      <TabBar tab={tab} setTab={setTab} />

      {/* Hidden VoiceConnect — handles all API logic */}
      <VoiceConnect
        ref={vcRef}
        headless
        onAlert={onAlert}
        mode="senior"
        onStateChange={setVoiceState}
        onResponse={setResponse}
        onTranscript={setTranscript}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 sm:pb-8">
        <AnimatePresence mode="wait">

          {/* ── TALK TAB ──────────────────────────────────────── */}
          {tab === 'talk' && (
            <motion.div
              key="talk"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }} transition={{ duration: .25 }}
            >
              {/* Quick actions */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
                {QUICK_ACTIONS.map((qa, i) => (
                  <motion.button
                    key={qa.label}
                    onClick={() => handleQuickAction(qa.message)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border rounded-full font-medium text-helper-ink text-sm shadow-sm transition-all"
                    style={{ borderColor: '#D8D0C4' }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .05 }}
                    whileHover={{ borderColor: '#1C1917', background: '#F0EBE2' }}
                    whileTap={{ scale: .95 }}
                  >
                    <span className="text-base">{qa.icon}</span>{qa.label}
                  </motion.button>
                ))}
              </div>

              {/* Top bar: time + SOS */}
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm" style={{ color: '#A09890' }}>{timeStr}</p>
                <button
                  onClick={() => setSosConfirm(v => !v)}
                  className="flex items-center justify-center text-white shadow-md transition-all active:scale-95 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider"
                  style={{ background: '#C0392B' }}
                >HELP</button>
              </div>

              {/* SOS confirm */}
              <AnimatePresence>
                {sosConfirm && (
                  <motion.div
                    className="mb-4 rounded-2xl px-5 py-4"
                    style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: .2 }}
                  >
                    <p className="font-semibold text-red-700 text-sm mb-0.5">Send emergency alert?</p>
                    <p className="text-xs text-gray-500 mb-3">Your caregivers will be notified immediately.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSos} disabled={sosSent}
                        className="flex-1 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-60"
                        style={{ background: '#C0392B' }}
                      >{sosSent ? 'Sent ✓' : 'Yes, Send'}</button>
                      <button
                        onClick={() => setSosConfirm(false)}
                        className="flex-1 text-helper-ink text-sm font-semibold py-2 rounded-xl"
                        style={{ border: '1.5px solid #C8C0B4', background: 'transparent' }}
                      >Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Orb — centred on cream */}
              <div className="flex flex-col items-center py-6">

                <div className="mb-8">
                  <HelperOrb voiceState={voiceState} />
                </div>

                {/* Transcript bubble */}
                <AnimatePresence>
                  {transcript && (voiceState === 'thinking' || voiceState === 'listening') && (
                    <motion.div
                      className="w-full mb-4 rounded-2xl px-5 py-3"
                      style={{ background: 'rgba(28,25,23,.06)', border: '1px solid rgba(28,25,23,.08)' }}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                      <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#A09890' }}>You said</p>
                      <p className="text-helper-ink leading-relaxed">{transcript}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Helper greeting / response text */}
                <AnimatePresence mode="wait">
                  {displayText && (
                    <motion.p
                      key={displayText.slice(0, 30)}
                      className="font-lora text-2xl text-center leading-relaxed mb-8 px-2"
                      style={{ color: '#1C1917', fontWeight: 400, maxWidth: 440 }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ duration: .3 }}
                    >
                      {displayText}
                    </motion.p>
                  )}
                  {voiceState === 'thinking' && !response && (
                    <motion.div
                      key="typing"
                      className="flex gap-2 items-center mb-8"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i} className="w-2.5 h-2.5 rounded-full"
                          style={{ background: '#C8C0B4' }}
                          animate={{ opacity: [.3, 1, .3], scale: [.8, 1.2, .8] }}
                          transition={{ duration: .8, repeat: Infinity, delay: i * .2 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* "I'm here" button — dark pill, no card box */}
                <motion.button
                  onClick={() => vcRef.current?.triggerVoice()}
                  disabled={voiceState === 'thinking'}
                  className="text-white font-medium text-xl rounded-full px-14 py-5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: buttonBg,
                    boxShadow: '0 8px 24px rgba(28,25,23,.18)',
                    transition: 'background .4s ease',
                  }}
                  whileHover={voiceState !== 'thinking' ? { scale: 1.03, boxShadow: '0 12px 32px rgba(28,25,23,.25)' } : {}}
                  whileTap={{ scale: .96 }}
                >
                  {buttonLabel}
                </motion.button>

                <p className="text-sm mt-5" style={{ color: '#A09890' }}>
                  {voiceState === 'idle'      ? 'Tap the button and speak clearly'  :
                   voiceState === 'listening' ? 'Speak now, or tap to stop'         :
                   voiceState === 'speaking'  ? 'Tap to interrupt'                  : '\u00A0'}
                </p>

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
