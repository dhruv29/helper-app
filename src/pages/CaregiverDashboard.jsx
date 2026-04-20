import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api.js'

// ── Data ───────────────────────────────────────────────────────────────────────

const MEDICATIONS = [
  { id: 1, name: 'Metformin 500mg',   time: '8:00 AM',  taken: true,  takenAt: '8:12 AM',  note: 'With breakfast' },
  { id: 2, name: 'Lisinopril 10mg',   time: '12:00 PM', taken: true,  takenAt: '12:03 PM', note: 'With lunch'      },
  { id: 3, name: 'Atorvastatin 20mg', time: '8:00 PM',  taken: false, takenAt: null,        note: 'With dinner'    },
]

const VITALS = [
  { label: 'Blood Pressure', value: '124/78', unit: 'mmHg', icon: '🩺', trend: 0,  good: true  },
  { label: 'Heart Rate',     value: '72',     unit: 'bpm',  icon: '❤️', trend: -2, good: true  },
  { label: 'Weight',         value: '142',    unit: 'lbs',  icon: '⚖️', trend: 0,  good: true  },
  { label: 'Blood Sugar',    value: '108',    unit: 'mg/dL',icon: '🩸', trend: 4,  good: false },
]

const BANK_ACCOUNTS = [
  { name: 'Checking', bank: 'Chase', last4: '4821', balance: '$2,847',  updated: '2 hrs ago'  },
  { name: 'Savings',  bank: 'Chase', last4: '3902', balance: '$18,340', updated: '3 days ago' },
]

const TRANSACTIONS = [
  { id: 1, desc: 'Walgreens Pharmacy',    amount: '-$24.50',    date: 'Today, 10:30 AM', flagged: false, positive: false },
  { id: 2, desc: 'Wire Transfer Attempt', amount: '-$450.00',   date: 'Today, 9:15 AM',  flagged: true,  positive: false, note: 'Blocked by Helper' },
  { id: 3, desc: 'Social Security',        amount: '+$1,842.00', date: 'Yesterday',       flagged: false, positive: true  },
  { id: 4, desc: 'Medicare Premium',       amount: '-$170.10',   date: 'Apr 11',          flagged: false, positive: false },
  { id: 5, desc: 'Publix Supermarket',     amount: '-$67.23',    date: 'Apr 11',          flagged: false, positive: false },
]

const SCAM     = { today: 1, month: 7, saved: '$2,350' }
const APPOINTMENTS = [
  { title: 'Dr. Johnson — Primary Care', date: 'Tue, Apr 15', time: '2:00 PM', icon: '🩺' },
  { title: 'Blood Panel Lab Work',        date: 'Thu, Apr 17', time: '9:00 AM', icon: '🔬' },
]
const WELLNESS_SCORE = 92

const makeActivity = (name) => ({
  lastSeen: '2 hours ago', sessions: 3, weeklyAvg: 4.2, streak: 8,
  weekBars: [3, 2, 4, 1, 3, 4, 3],
  timeline: [
    { icon: '☀️', label: `Morning check-in — ${name} was in good spirits`, time: '8:42 AM', bg: '#EEF5F2' },
    { icon: '💊', label: 'Medication reminder acknowledged',                time: '9:01 AM', bg: '#EEF1F8' },
    { icon: '📞', label: `Spoke for ~18 min — discussed the garden`,        time: '2:15 PM', bg: '#FDF6EC' },
    { icon: '🛡️', label: 'IRS scam call intercepted and blocked',           time: '11:24 AM', bg: '#FEF2F2' },
  ],
})
const makeHandoff = (name) =>
  `${name} had a steady day. They mentioned their hip a few times in the morning but their mood lifted by the afternoon. They enjoyed talking about the garden — the tomatoes are coming in. No concerns worth worrying about tonight. You can put it down. I've got them. Sleep.`
const makeInsight = (name) =>
  `${name} had a great morning — they asked about their bridge club and mentioned feeling well-rested. Medication adherence is on a 7-day streak. Watch the evening Atorvastatin dose.`

// ── Design tokens ──────────────────────────────────────────────────────────────

const C = {
  ink:      '#1C1917',
  inkMid:   '#2D2A27',
  inkLight: '#6B6560',
  inkMuted: '#A09890',
  cream:    '#EDE8DF',
  creamMid: '#F7F4EF',
  creamInput: '#F0EBE2',
  border:   '#E8E2DA',
  sage:     '#8FAF9F',
  gold:     '#E8C890',
  danger:   '#C0392B',
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function Card({ children, className = '', style, delay = 0, noPad = false }) {
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm ${noPad ? '' : 'p-5'} ${className}`}
      style={{ border: `1px solid ${C.border}`, ...style }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
    >
      {children}
    </motion.div>
  )
}

function Badge({ children, color = 'ink' }) {
  const map = {
    sage:   { bg: '#EEF5F2', text: '#5A8F7B', border: '#C8E0D4' },
    amber:  { bg: '#FDF6EC', text: '#92650A', border: '#F0D898' },
    danger: { bg: '#FEF2F2', text: C.danger,  border: '#FCA5A5' },
    ink:    { bg: '#F0EBE2', text: C.inkLight, border: C.border },
    blue:   { bg: '#EEF1F8', text: '#3B5EA8', border: '#C8D4F0' },
  }[color] ?? { bg: '#F0EBE2', text: C.inkLight, border: C.border }

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: map.bg, color: map.text, border: `1px solid ${map.border}` }}
    >{children}</span>
  )
}

function CardLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.inkMuted }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px w-full" style={{ background: C.border }} />
}

// ── Wellness ring ──────────────────────────────────────────────────────────────

function WellnessRing({ score }) {
  const pct   = (Math.min(100, score) / 100) * 251
  const color = score >= 80 ? C.sage : score >= 60 ? C.gold : C.danger
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'At Risk'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(28,25,23,.07)" strokeWidth="7" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 251' }}
            animate={{ strokeDasharray: `${pct} 251` }}
            transition={{ delay: .3, duration: .9, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-lora text-4xl font-medium" style={{ color: C.ink }}>{score}</span>
        </div>
      </div>
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
    </div>
  )
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function QuickActionItem({ icon, title, desc, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-all"
      style={{ background: hover ? C.border : C.creamMid }}
    >
      <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium leading-tight" style={{ color: C.ink }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>{desc}</p>
      </div>
    </button>
  )
}

function SendMessageModal({ parentName, onClose }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!text.trim()) return
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28,25,23,.5)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#fff', border: `1px solid ${C.border}` }}
        initial={{ scale: .95, y: 12 }} animate={{ scale: 1, y: 0 }}
      >
        {sent ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-lora text-lg font-medium" style={{ color: C.ink }}>Message sent to {parentName}</p>
            <p className="text-sm mt-1" style={{ color: C.inkMuted }}>Helper will deliver it naturally in conversation.</p>
          </div>
        ) : (
          <>
            <p className="font-lora text-lg font-medium mb-1" style={{ color: C.ink }}>Send {parentName} a message</p>
            <p className="text-sm mb-4" style={{ color: C.inkMuted }}>Helper will weave it into conversation naturally.</p>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`e.g. Tell ${parentName} I'll call at 4pm today and I love her…`}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{
                background: C.creamInput,
                border: `1.5px solid ${C.border}`,
                color: C.ink,
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = C.ink}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSend}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: C.ink, color: C.cream }}
              >Send Message</button>
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm"
                style={{ background: C.creamInput, color: C.inkLight, border: `1px solid ${C.border}` }}
              >Cancel</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function OverviewTab({ alerts, medications, wellness, handoff, parentName, activity }) {
  const taken       = medications.filter(m => m.taken).length
  const total       = medications.length
  const urgentAlerts = alerts.filter(a => a.type === 'high')
  const [modal, setModal] = useState(null)

  return (
    <div className="space-y-4">

      {/* ── Row 1: hero stats ────────────────────────── */}
      <Card delay={0}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.sage }}>
              Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <h2 className="font-lora text-2xl font-medium leading-tight" style={{ color: C.ink }}>
              {parentName} is doing well
            </h2>
            <p className="text-xs mt-1" style={{ color: C.inkMuted }}>Active {activity.lastSeen}</p>
          </div>
          <Badge color="sage">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Protected
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Meds',     value: `${taken}/${total}`, sub: 'taken',    warn: taken < total },
            { label: 'Blocked',  value: SCAM.today,          sub: 'scams',    warn: false         },
            { label: 'Sessions', value: activity.sessions,   sub: 'today',    warn: false         },
            { label: 'Streak',   value: `${activity.streak}d`, sub: 'streak', warn: false         },
          ].map(({ label, value, sub, warn }) => (
            <div key={label} className="rounded-xl p-3 text-center"
              style={{ background: warn ? '#FDF6EC' : C.creamMid, border: `1px solid ${warn ? '#F0D898' : C.border}` }}>
              <p className="font-lora text-xl font-medium leading-none" style={{ color: warn ? '#92650A' : C.ink }}>
                {value}
              </p>
              <p className="text-[9px] font-semibold mt-1 uppercase tracking-wide" style={{ color: warn ? '#C8900A' : C.inkMuted }}>
                {sub}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Row 2: Wellness + Activity ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Wellness score — dark card */}
        <motion.div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: C.ink, border: `1px solid ${C.inkMid}` }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .05, type: 'spring', stiffness: 260, damping: 24 }}
        >
          <CardLabel><span style={{ color: 'rgba(237,232,223,.35)' }}>Wellness Score</span></CardLabel>
          <div className="flex items-center gap-6 mb-4">
            <WellnessRing score={wellness?.overall ?? WELLNESS_SCORE} />
            <div className="flex-1">
              <p className="text-sm mb-3" style={{ color: 'rgba(237,232,223,.5)' }}>Doing well today</p>
              <div className="space-y-2">
                {[
                  { dot: C.sage,  label: 'Mood positive'      },
                  { dot: C.sage,  label: 'Engaged well'        },
                  { dot: C.gold,  label: 'Mentioned hip pain'  },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.dot }} />
                    <p className="text-xs" style={{ color: 'rgba(237,232,223,.5)' }}>{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Mini bar */}
          <div className="h-1 rounded-full overflow-hidden mt-auto" style={{ background: 'rgba(237,232,223,.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: C.sage }}
              initial={{ width: 0 }} animate={{ width: `${wellness?.overall ?? WELLNESS_SCORE}%` }}
              transition={{ delay: .4, duration: .8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Activity timeline */}
        <Card delay={.07} noPad>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <CardLabel>Today's Activity</CardLabel>
            <p className="text-[11px]" style={{ color: C.inkMuted }}>{activity.sessions} sessions</p>
          </div>
          <Divider />
          {activity.timeline.map((item, i) => (
            <div key={i}>
              <div className="px-5 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm mt-0.5"
                  style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: C.ink }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>{item.time}</p>
                </div>
              </div>
              {i < activity.timeline.length - 1 && <Divider />}
            </div>
          ))}
        </Card>
      </div>

      {/* ── Row 3: Nightly Handoff (full width) ──────── */}
      <motion.div
        className="rounded-2xl p-5"
        style={{ background: C.creamMid, border: `1px solid ${C.border}` }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .1, type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="flex items-center justify-between mb-3">
          <CardLabel>Tonight's Handoff</CardLabel>
          <span className="text-[11px] font-semibold" style={{ color: C.inkMuted }}>8:47 PM</span>
        </div>
        <blockquote
          className="font-lora italic text-base leading-relaxed pl-4 mb-4"
          style={{ borderLeft: `3px solid ${C.gold}`, color: C.inkMid }}
        >
          "{handoff?.body}"
        </blockquote>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: '#FDF6EC', border: `1px solid ${C.gold}66` }}>🤖</div>
            <p className="text-xs" style={{ color: C.inkMuted }}>Sent by Helper</p>
          </div>
          <button
            className="text-xs font-semibold transition-colors"
            style={{ color: C.inkLight, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.color = C.ink}
            onMouseLeave={e => e.target.style.color = C.inkLight}
          >View full summary →</button>
        </div>
      </motion.div>

      {/* ── Row 4: Scam alerts + Quick Actions ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Scam alerts */}
        <Card delay={.13} noPad style={{ background: '#FEF8F8', border: '1px solid #FCE8E8' }}>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <CardLabel><span style={{ color: C.danger }}>Scam Alerts</span></CardLabel>
            <Badge color="danger">{SCAM.today} today</Badge>
          </div>
          <Divider />
          <div className="px-5 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: '#FCE8E8' }}>🚫</div>
            <div className="flex-1 min-w-0">
              <Badge color="danger">Blocked</Badge>
              <p className="text-sm mt-1 leading-snug" style={{ color: C.ink }}>
                IRS impersonation call intercepted. {parentName} was coached to hang up.
              </p>
              <p className="text-xs mt-1" style={{ color: C.inkMuted }}>11:24 AM · (202) 555-0147</p>
            </div>
          </div>
          <Divider />
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: C.inkMuted }}>
              <span className="font-semibold" style={{ color: C.sage }}>{SCAM.saved} saved</span> this year
            </p>
            <p className="text-xs" style={{ color: C.inkMuted }}>{SCAM.month} blocked this month</p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card delay={.15}>
          <CardLabel>Quick Actions</CardLabel>
          <div className="space-y-2">
            <QuickActionItem
              icon="💬"
              title={`Send ${parentName} a message`}
              desc="Helper will deliver it naturally in conversation"
              onClick={() => setModal('message')}
            />
            <QuickActionItem
              icon="📅"
              title="Schedule a call reminder"
              desc={`Remind ${parentName} at a set time`}
              onClick={() => {}}
            />
            <QuickActionItem
              icon="👩‍💼"
              title="Talk to Helper support"
              desc="Reach a human on our team"
              onClick={() => {}}
            />
          </div>
        </Card>
      </div>

      {/* ── Row 5: Urgent alerts (conditional) ───────── */}
      <AnimatePresence>
        {urgentAlerts.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.inkMuted }}>
              Urgent Alerts
            </p>
            {urgentAlerts.map((a, i) => (
              <div key={a.id} className="rounded-2xl p-4 border-l-4 flex items-start gap-3"
                style={{ background: '#FEF8F8', border: `1px solid #FCA5A5`, borderLeftColor: C.danger }}>
                <span className="text-2xl flex-shrink-0">{a.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.ink }}>{a.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: C.inkLight }}>{a.msg}</p>
                  <p className="text-xs mt-1" style={{ color: C.inkMuted }}>{a.time}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message modal */}
      <AnimatePresence>
        {modal === 'message' && (
          <SendMessageModal parentName={parentName} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Health tab ─────────────────────────────────────────────────────────────────

function HealthTab({ medications, wellness }) {
  const taken     = medications.filter(m => m.taken).length
  const adherence = Math.round((taken / (medications.length || 1)) * 100)

  return (
    <div className="space-y-5">
      <Card noPad>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold" style={{ color: C.ink }}>Medications</p>
              <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>Today</p>
            </div>
            <Badge color={adherence === 100 ? 'sage' : 'amber'}>{adherence}% adherence</Badge>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: C.creamInput }}>
            <motion.div className="h-full rounded-full"
              style={{ background: adherence === 100 ? C.sage : C.gold }}
              initial={{ width: 0 }} animate={{ width: `${adherence}%` }}
              transition={{ delay: .2, duration: .8, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between">
            <p className="text-xs" style={{ color: C.inkMuted }}>{taken} of {medications.length} doses taken</p>
            <p className="text-xs font-semibold" style={{ color: C.sage }}>🔥 7-day streak</p>
          </div>
        </div>
        <Divider />
        {medications.map((med, i) => (
          <div key={med.id}>
            <motion.div className="px-5 py-4 flex items-center gap-4"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: .05 + i * .06 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                style={{
                  background: med.taken ? '#EEF5F2' : '#FDF6EC',
                  border: `1px solid ${med.taken ? '#C8E0D4' : '#F0D898'}`,
                }}>
                {med.taken ? '✅' : '⏳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: C.ink }}>{med.name}</p>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>{med.note} · {med.time}</p>
              </div>
              {med.taken
                ? <p className="text-xs font-semibold flex-shrink-0" style={{ color: C.sage }}>✓ {med.takenAt}</p>
                : <Badge color="amber">Pending</Badge>}
            </motion.div>
            {i < medications.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.inkMuted }}>
          Vitals · Last recorded Apr 12
        </p>
        <div className="grid grid-cols-2 gap-3">
          {VITALS.map((v, i) => (
            <Card key={v.label} delay={.08 + i * .05}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{v.icon}</span>
                <Badge color={v.good ? 'sage' : 'amber'}>
                  {v.trend === 0 ? '→' : v.trend > 0 ? '↑' : '↓'} {v.trend === 0 ? 'Stable' : Math.abs(v.trend)}
                </Badge>
              </div>
              <p className="font-lora text-3xl font-medium leading-none" style={{ color: C.ink }}>{v.value}</p>
              <p className="text-sm mt-1.5 font-medium" style={{ color: C.inkLight }}>{v.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.inkMuted }}>{v.unit}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card noPad delay={.3}>
        <div className="px-5 py-3.5 flex items-center gap-2">
          <span>📅</span>
          <p className="font-semibold text-sm" style={{ color: C.ink }}>Upcoming Appointments</p>
        </div>
        <Divider />
        {APPOINTMENTS.map((apt, i) => (
          <div key={i}>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#EEF5F2', border: '1px solid #C8E0D4' }}>
                {apt.icon}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: C.ink }}>{apt.title}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: C.sage }}>{apt.date} · {apt.time}</p>
              </div>
            </div>
            {i < APPOINTMENTS.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Finance tab ────────────────────────────────────────────────────────────────

function FinanceTab() {
  const flaggedCount = TRANSACTIONS.filter(t => t.flagged).length
  return (
    <div className="space-y-5">
      <Card delay={0} style={{ background: '#EEF5F2', border: '1px solid #C8E0D4' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.sage }}>
              Financial Safety
            </p>
            <p className="font-lora text-2xl font-medium leading-tight" style={{ color: C.ink }}>
              Accounts Protected 🛡️
            </p>
            <p className="text-xs mt-1" style={{ color: C.inkMuted }}>No unauthorized activity detected</p>
          </div>
          <div className="text-right">
            <p className="font-lora text-3xl font-medium" style={{ color: C.sage }}>{SCAM.saved}</p>
            <p className="text-[10px] uppercase tracking-wide font-semibold mt-0.5" style={{ color: C.inkMuted }}>saved this year</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Scams blocked today', value: SCAM.today, icon: '🚫' },
            { label: 'Blocked this month',  value: SCAM.month, icon: '📊' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #C8E0D4' }}>
              <span className="text-xl">{icon}</span>
              <div>
                <p className="font-lora text-xl font-medium leading-none" style={{ color: C.ink }}>{value}</p>
                <p className="text-[10px] font-medium mt-0.5 leading-tight" style={{ color: C.inkMuted }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.inkMuted }}>Bank Accounts</p>
        <div className="space-y-3">
          {BANK_ACCOUNTS.map((acct, i) => (
            <Card key={acct.last4} delay={i * .07} noPad className="overflow-hidden">
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${C.sage}, ${C.gold})` }} />
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: '#EEF5F2', border: '1px solid #C8E0D4' }}>🏦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: C.ink }}>{acct.bank} {acct.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>···· {acct.last4} · {acct.updated}</p>
                </div>
                <div className="text-right">
                  <p className="font-lora text-xl font-medium" style={{ color: C.ink }}>{acct.balance}</p>
                  <Badge color="sage">Normal</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card delay={.15} noPad>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💳</span>
            <p className="font-semibold text-sm" style={{ color: C.ink }}>Recent Transactions</p>
          </div>
          {flaggedCount > 0 && <Badge color="danger">⚠ {flaggedCount} flagged</Badge>}
        </div>
        <Divider />
        {TRANSACTIONS.map((tx, i) => (
          <div key={tx.id}>
            <motion.div
              className="px-5 py-3.5 flex items-center gap-3"
              style={{ background: tx.flagged ? '#FEF8F8' : 'transparent' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: .2 + i * .05 }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  background: tx.flagged ? '#FEE2E2' : tx.positive ? '#EEF5F2' : C.creamInput,
                  border: `1px solid ${tx.flagged ? '#FCA5A5' : tx.positive ? '#C8E0D4' : C.border}`,
                }}>
                {tx.flagged ? '🚨' : tx.positive ? '💚' : '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: tx.flagged ? C.danger : C.ink }}>{tx.desc}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs" style={{ color: C.inkMuted }}>{tx.date}</p>
                  {tx.note && <Badge color="danger">{tx.note}</Badge>}
                </div>
              </div>
              <p className="text-sm font-semibold flex-shrink-0"
                style={{ color: tx.positive ? '#5A8F7B' : tx.flagged ? C.danger : C.inkLight }}>
                {tx.amount}
              </p>
            </motion.div>
            {i < TRANSACTIONS.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Alerts tab ─────────────────────────────────────────────────────────────────

function AlertsTab({ alerts }) {
  const urgentCount = alerts.filter(a => a.type === 'high').length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: C.ink }}>
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
        </p>
        {urgentCount > 0 && <Badge color="danger">🔴 {urgentCount} urgent</Badge>}
      </div>
      {alerts.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="font-lora text-lg font-medium" style={{ color: C.ink }}>All Clear</p>
          <p className="text-sm mt-1" style={{ color: C.inkMuted }}>Nothing needs your attention</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const isHigh = a.type === 'high'
            return (
              <motion.div key={a.id}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{
                  background: isHigh ? '#FEF8F8' : '#FFFBF0',
                  border: `1px solid ${isHigh ? '#FCA5A5' : '#F0D898'}`,
                  borderLeft: `4px solid ${isHigh ? C.danger : C.gold}`,
                }}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * .06 }}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={isHigh ? 'danger' : 'amber'}>{isHigh ? 'URGENT' : 'REVIEW'}</Badge>
                    <span className="text-xs" style={{ color: C.inkMuted }}>{a.time}</span>
                  </div>
                  <p className="font-semibold text-sm leading-snug" style={{ color: C.ink }}>{a.title}</p>
                  <p className="text-sm mt-0.5 leading-snug" style={{ color: C.inkLight }}>{a.msg}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview', icon: '◎', label: "Today's Overview" },
  { id: 'health',   icon: '💊', label: 'Health'           },
  { id: 'finance',  icon: '💳', label: 'Finance'          },
  { id: 'alerts',   icon: '🔔', label: 'Alerts'           },
]

function Sidebar({ tab, setTab, urgentCount, parentName }) {
  return (
    <div
      className="hidden sm:flex flex-col flex-shrink-0 w-56 sticky self-start"
      style={{ background: C.ink, top: 60, height: 'calc(100vh - 60px)' }}
    >
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(237,232,223,.08)' }}>
        <p className="font-lora text-base font-medium" style={{ color: 'rgba(237,232,223,.4)' }}>
          Caregiver Dashboard
        </p>
        <p className="font-lora text-lg font-medium mt-0.5" style={{ color: C.cream }}>{parentName}'s Care</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className="w-full flex items-center gap-3 px-6 py-3 text-left text-sm transition-all border-l-2"
            style={{
              color: tab === n.id ? C.cream : 'rgba(237,232,223,.4)',
              background: tab === n.id ? 'rgba(237,232,223,.07)' : 'transparent',
              borderLeftColor: tab === n.id ? C.cream : 'transparent',
              fontWeight: tab === n.id ? 500 : 400,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <span className="text-base w-5 text-center">{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {n.id === 'alerts' && urgentCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: C.danger, color: '#fff' }}>{urgentCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Helper insight blurb */}
      <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(237,232,223,.05)', border: '1px solid rgba(237,232,223,.07)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(237,232,223,.3)' }}>
          Helper's note
        </p>
        <p className="text-xs leading-relaxed font-lora italic" style={{ color: 'rgba(237,232,223,.45)' }}>
          "{makeInsight(parentName)}"
        </p>
      </div>

      <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(237,232,223,.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8FA8A0, #C8A898)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: C.cream }}>Caregiver</p>
            <p className="text-[11px]" style={{ color: 'rgba(237,232,223,.4)' }}>Primary</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function CaregiverDashboard({ alerts: alertsProp, profile = {} }) {
  const parentName = profile.parentName || 'your parent'
  const seniorId   = profile.seniorId
  const activity = makeActivity(parentName)
  const [tab, setTab] = useState('overview')

  const [alerts,      setAlerts]      = useState(alertsProp ?? [])
  const [medications, setMedications] = useState(MEDICATIONS)
  const [wellness,    setWellness]    = useState({ overall: WELLNESS_SCORE })
  const [handoff,     setHandoff]     = useState({ body: makeHandoff(parentName) })

  useEffect(() => {
    if (!seniorId) return
    const load = async () => {
      try {
        const [dbAlerts, dbMeds, dbWellness, dbHandoff] = await Promise.all([
          api.alerts.list(seniorId),
          api.medications.list(seniorId),
          api.wellness.today(seniorId),
          api.handoffs.latest(seniorId),
        ])
        if (dbAlerts?.length)    setAlerts(dbAlerts.map(a => ({ ...a, time: new Date(a.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })))
        if (dbMeds?.length)      setMedications(dbMeds.map(m => ({ id: m.id, name: `${m.name} ${m.dose ?? ''}`.trim(), time: m.schedule, taken: m.taken_today, takenAt: m.last_taken ? new Date(m.last_taken).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null, note: m.schedule })))
        if (dbWellness?.overall) setWellness(dbWellness)
        if (dbHandoff?.body)     setHandoff(dbHandoff)
      } catch {
        // Supabase not configured — keep mock data
      }
    }
    load()
  }, [seniorId])

  const urgentCount = alerts.filter(a => a.type === 'high').length

  return (
    <div className="flex min-h-screen" style={{ background: C.creamMid }}>

      <Sidebar tab={tab} setTab={setTab} urgentCount={urgentCount} parentName={parentName} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b sticky top-[60px] z-20"
          style={{ background: C.creamMid, borderColor: C.border }}>
          <div>
            <h1 className="font-lora text-xl font-medium" style={{ color: C.ink }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.danger }} />
              <span className="text-xs font-medium" style={{ color: C.danger }}>
                {urgentCount} scam call{urgentCount !== 1 ? 's' : ''} blocked
              </span>
            </div>
          )}
        </div>

        {/* Mobile tab bar */}
        <div className="sm:hidden flex border-b overflow-x-auto"
          style={{ borderColor: C.border, background: C.creamMid }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className="flex-shrink-0 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors border-b-2"
              style={{
                color: tab === n.id ? C.ink : C.inkMuted,
                borderBottomColor: tab === n.id ? C.ink : 'transparent',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              {n.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 px-5 sm:px-8 py-5 sm:py-6 max-w-3xl w-full">
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }}>
                <OverviewTab alerts={alerts} medications={medications} wellness={wellness} handoff={handoff} parentName={parentName} activity={activity} />
              </motion.div>
            )}
            {tab === 'health' && (
              <motion.div key="hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }}>
                <HealthTab medications={medications} wellness={wellness} />
              </motion.div>
            )}
            {tab === 'finance' && (
              <motion.div key="fn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }}>
                <FinanceTab />
              </motion.div>
            )}
            {tab === 'alerts' && (
              <motion.div key="al" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }}>
                <AlertsTab alerts={alerts} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
