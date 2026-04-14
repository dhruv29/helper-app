import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Data ──────────────────────────────────────────────────────────────────────

const PARENT = 'Margaret'

const MEDICATIONS = [
  { id: 1, name: 'Metformin 500mg',   time: '8:00 AM',  taken: true,  takenAt: '8:12 AM',  note: 'With breakfast' },
  { id: 2, name: 'Lisinopril 10mg',   time: '12:00 PM', taken: true,  takenAt: '12:03 PM', note: 'With lunch'      },
  { id: 3, name: 'Atorvastatin 20mg', time: '8:00 PM',  taken: false, takenAt: null,        note: 'With dinner'    },
]

const VITALS = [
  { label: 'Blood Pressure', value: '124/78', unit: 'mmHg', icon: '🩺', trend: 0,   good: true  },
  { label: 'Heart Rate',     value: '72',     unit: 'bpm',  icon: '❤️', trend: -2,  good: true  },
  { label: 'Weight',         value: '142',    unit: 'lbs',  icon: '⚖️', trend: 0,   good: true  },
  { label: 'Blood Sugar',    value: '108',    unit: 'mg/dL',icon: '🩸', trend: 4,   good: false },
]

const BANK_ACCOUNTS = [
  { name: 'Checking', bank: 'Chase', last4: '4821', balance: '$2,847',  updated: '2 hrs ago'  },
  { name: 'Savings',  bank: 'Chase', last4: '3902', balance: '$18,340', updated: '3 days ago' },
]

const TRANSACTIONS = [
  { id: 1, desc: 'Walgreens Pharmacy',    amount: '-$24.50',    date: 'Today, 10:30 AM', flagged: false, positive: false },
  { id: 2, desc: 'Wire Transfer Attempt', amount: '-$450.00',   date: 'Today, 9:15 AM',  flagged: true,  positive: false, note: 'Blocked by Helper' },
  { id: 3, desc: 'Social Security',        amount: '+$1,842.00', date: 'Yesterday',       flagged: false, positive: true  },
  { id: 4, desc: 'Medicare Premium',       amount: '-$170.10',   date: 'Apr 11',           flagged: false, positive: false },
  { id: 5, desc: 'Publix Supermarket',     amount: '-$67.23',    date: 'Apr 11',           flagged: false, positive: false },
]

const SCAM  = { today: 1, month: 7, saved: '$2,350' }
const ACTIVITY = { lastSeen: '2 hours ago', sessions: 3, weeklyAvg: 4.2, streak: 8, weekBars: [3, 2, 4, 1, 3, 4, 3] }
const APPOINTMENTS = [
  { title: 'Dr. Johnson — Primary Care', date: 'Tue, Apr 15', time: '2:00 PM', icon: '🩺', color: 'indigo' },
  { title: 'Blood Panel Lab Work',        date: 'Thu, Apr 17', time: '9:00 AM', icon: '🔬', color: 'violet' },
]
const INSIGHT = "Margaret had a great morning — she asked about her bridge club and mentioned feeling well-rested. Medication adherence is on a 7-day streak. Watch the evening Atorvastatin dose."

// ── Primitives ────────────────────────────────────────────────────────────────

const G = {
  card:   'bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl',
  cardHi: 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-2xl',
  div:    'border-white/[0.06]',
}

const fade  = (d = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, type: 'spring', stiffness: 260, damping: 24 } })
const slide = (d = 0) => ({ initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: d, type: 'spring', stiffness: 260, damping: 24 } })

function Card({ children, className = '', delay = 0, glow }) {
  return (
    <motion.div className={`${G.card} ${className}`} {...fade(delay)}
      style={glow ? { boxShadow: `0 0 40px ${glow}` } : undefined}>
      {children}
    </motion.div>
  )
}

function Pill({ children, color = 'white' }) {
  const c = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    amber:   'bg-amber-500/15   text-amber-400   border-amber-500/25',
    red:     'bg-red-500/15     text-red-400     border-red-500/25',
    indigo:  'bg-indigo-500/15  text-indigo-400  border-indigo-500/25',
    white:   'bg-white/10       text-white/60    border-white/10',
  }[color]
  return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c}`}>{children}</span>
}

function Label({ children }) {
  return <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">{children}</p>
}

// ── Wellness Ring ─────────────────────────────────────────────────────────────

function WellnessRing({ score }) {
  const pct   = (score / 100) * 251
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const glow  = score >= 80 ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'At Risk'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${pct} 251`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white leading-none">{score}</span>
        </div>
      </div>
      <p className="text-xs font-bold" style={{ color }}>{label}</p>
    </div>
  )
}

// ── Alert Card ────────────────────────────────────────────────────────────────

const A_STYLES = {
  high:   { border: 'border-red-500/50',    badge: 'red',    label: 'URGENT', pulse: true  },
  medium: { border: 'border-amber-400/50',  badge: 'amber',  label: 'REVIEW', pulse: false },
  low:    { border: 'border-emerald-400/40',badge: 'emerald',label: 'INFO',   pulse: false },
}

function AlertCard({ alert, index = 0 }) {
  const s = A_STYLES[alert.type] || A_STYLES.low
  return (
    <motion.div className={`${G.card} border-l-4 ${s.border} p-4`} {...slide(index * 0.06)}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Pill color={s.badge}>{s.label}</Pill>
            <span className="text-xs text-white/25">{alert.time}</span>
            {s.pulse && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>}
          </div>
          <p className="font-bold text-white text-sm leading-snug">{alert.title}</p>
          <p className="text-sm text-white/45 mt-0.5 leading-snug">{alert.msg}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ alerts }) {
  const taken  = MEDICATIONS.filter(m => m.taken).length
  const total  = MEDICATIONS.length
  const urgent = alerts.filter(a => a.type === 'high')

  return (
    <div className="space-y-4">

      {/* Hero */}
      <motion.div className="rounded-2xl overflow-hidden relative" {...fade(0)}
        style={{ background: 'linear-gradient(140deg, rgba(79,70,229,0.40) 0%, rgba(99,102,241,0.15) 60%, rgba(139,92,246,0.10) 100%)', border: '1px solid rgba(99,102,241,0.22)', boxShadow: '0 0 60px rgba(79,70,229,0.15)' }}>
        <div className="absolute inset-0 backdrop-blur-2xl" />
        {/* decorative circle */}
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
        <div className="relative z-10 p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-indigo-300/60 text-[11px] font-bold uppercase tracking-widest mb-1">Today's Overview</p>
              <h2 className="text-2xl font-black text-white leading-tight">{PARENT} is<br />doing well 👋</h2>
              <p className="text-white/35 text-xs mt-1.5">Active {ACTIVITY.lastSeen}</p>
            </div>
            <Pill color="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Safe</Pill>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Meds',     value: `${taken}/${total}`, sub: 'taken',   warn: taken < total },
              { label: 'Blocked',  value: SCAM.today,          sub: 'scams',   warn: false         },
              { label: 'Sessions', value: ACTIVITY.sessions,   sub: 'today',   warn: false         },
              { label: 'Streak',   value: `${ACTIVITY.streak}d`, sub: 'active', warn: false        },
            ].map(({ label, value, sub, warn }) => (
              <div key={label}
                className={`rounded-xl p-3 text-center ${warn ? 'bg-amber-500/20 border border-amber-400/30' : 'bg-white/[0.07] border border-white/[0.06]'}`}>
                <p className={`text-xl font-black leading-none ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</p>
                <p className="text-white/35 text-[9px] font-semibold mt-1 uppercase tracking-wide">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Wellness + Mood row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-5 flex flex-col items-center gap-3" delay={0.06}>
          <Label>Wellness Score</Label>
          <WellnessRing score={92} />
        </Card>
        <Card className="p-5 flex flex-col gap-3" delay={0.08}>
          <Label>Mood Today</Label>
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-2xl mb-3">😊</div>
            <p className="font-black text-white text-sm">Calm &amp; positive</p>
            <p className="text-xs text-white/35 mt-1 leading-snug">Based on today's conversations with Sarah</p>
          </div>
        </Card>
      </div>

      {/* Sarah's insight */}
      <motion.div className="rounded-2xl p-5 relative overflow-hidden" {...fade(0.1)}
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(139,92,246,0.22)' }}>
        <div className="absolute inset-0 backdrop-blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="text-xs font-black text-violet-300">Sarah's Insight</p>
              <p className="text-[10px] text-white/30">AI companion · Updated 2h ago</p>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">"{INSIGHT}"</p>
        </div>
      </motion.div>

      {/* Medications */}
      <Card delay={0.12} className="overflow-hidden">
        <div className={`px-5 py-3.5 border-b ${G.div} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-base">💊</span>
            <p className="font-black text-white text-sm">Medications Today</p>
          </div>
          <Pill color={taken === total ? 'emerald' : 'amber'}>{taken}/{total} taken</Pill>
        </div>
        {MEDICATIONS.map((med, i) => (
          <div key={med.id} className={`px-5 py-3.5 flex items-center gap-3 ${i > 0 ? `border-t ${G.div}` : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${med.taken ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-amber-500/15 border border-amber-500/25'}`}>
              {med.taken ? '✓' : '○'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{med.name}</p>
              <p className="text-xs text-white/35">{med.taken ? `Taken at ${med.takenAt}` : `Due ${med.time}`}</p>
            </div>
            {!med.taken && <Pill color="amber">Pending</Pill>}
          </div>
        ))}
      </Card>

      {/* Activity chart */}
      <Card delay={0.14} className="p-5">
        <Label>App Activity This Week</Label>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Today',    value: ACTIVITY.sessions,   unit: 'sessions' },
            { label: 'Weekly',   value: ACTIVITY.weeklyAvg,  unit: 'avg / day' },
            { label: 'Streak',   value: `${ACTIVITY.streak}`, unit: 'day streak' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-indigo-400 leading-none">{value}</p>
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wide mt-1">{unit}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1.5 h-12 mb-1.5">
          {ACTIVITY.weekBars.map((h, i) => {
            const isToday = i === 6
            return (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <div className="rounded-sm transition-all"
                  style={{
                    height: `${(h / 4) * 100}%`, minHeight: 4,
                    background: isToday
                      ? 'linear-gradient(180deg, #a5b4fc 0%, #6366f1 100%)'
                      : 'rgba(99,102,241,0.35)',
                    boxShadow: isToday ? '0 0 12px rgba(99,102,241,0.5)' : 'none'
                  }} />
              </div>
            )
          })}
        </div>
        <div className="flex">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} className={`flex-1 text-center text-[10px] font-semibold ${i === 6 ? 'text-indigo-400' : 'text-white/20'}`}>{d}</span>
          ))}
        </div>
      </Card>

      {urgent.length > 0 && (
        <div className="space-y-3">
          <Label>Urgent Alerts</Label>
          {urgent.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}
        </div>
      )}
    </div>
  )
}

// ── Tab: Health ───────────────────────────────────────────────────────────────

function HealthTab() {
  const taken     = MEDICATIONS.filter(m => m.taken).length
  const adherence = Math.round((taken / MEDICATIONS.length) * 100)

  return (
    <div className="space-y-5">

      {/* Medication tracker */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-black text-white text-base">Medications</p>
              <p className="text-xs text-white/35 mt-0.5">Apr 14 — today</p>
            </div>
            <Pill color={adherence === 100 ? 'emerald' : 'amber'}>{adherence}% adherence</Pill>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden mb-1.5">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }}
              initial={{ width: 0 }} animate={{ width: `${adherence}%` }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-white/35">{taken} of {MEDICATIONS.length} doses taken</p>
            <p className="text-xs font-bold text-emerald-400">🔥 7-day streak</p>
          </div>
        </div>

        <div className={`border-t ${G.div}`}>
          {MEDICATIONS.map((med, i) => (
            <motion.div key={med.id} className={`px-5 py-4 flex items-center gap-4 ${i > 0 ? `border-t ${G.div}` : ''}`}
              {...slide(0.05 + i * 0.06)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${med.taken ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-amber-500/15 border border-amber-500/25'}`}>
                {med.taken ? '✅' : '⏳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{med.name}</p>
                <p className="text-xs text-white/35 mt-0.5">{med.note} · {med.time}</p>
              </div>
              <div className="text-right">
                {med.taken
                  ? <p className="text-xs font-bold text-emerald-400">✓ {med.takenAt}</p>
                  : <Pill color="amber">Pending</Pill>}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Vitals */}
      <div>
        <Label>Vitals · Last recorded Apr 12</Label>
        <div className="grid grid-cols-2 gap-3">
          {VITALS.map((v, i) => (
            <motion.div key={v.label} className={`${G.card} p-4 ${!v.good ? '!border-amber-500/30' : ''}`}
              {...fade(0.08 + i * 0.05)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{v.icon}</span>
                <Pill color={v.good ? 'emerald' : 'amber'}>
                  {v.trend === 0 ? '→' : v.trend > 0 ? '↑' : '↓'} {v.trend === 0 ? 'Stable' : Math.abs(v.trend)}
                </Pill>
              </div>
              <p className="text-3xl font-black text-white leading-none">{v.value}</p>
              <p className="text-sm text-white/45 mt-1.5 font-medium">{v.label}</p>
              <p className="text-[10px] text-white/20 mt-0.5">{v.unit}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <Card delay={0.3} className="overflow-hidden">
        <div className={`px-5 py-3.5 border-b ${G.div} flex items-center gap-2`}>
          <span>📅</span>
          <p className="font-black text-white text-sm">Upcoming Appointments</p>
        </div>
        {APPOINTMENTS.map((apt, i) => {
          const bg = apt.color === 'indigo' ? 'bg-indigo-500/15 border-indigo-500/25' : 'bg-violet-500/15 border-violet-500/25'
          const tc = apt.color === 'indigo' ? 'text-indigo-400' : 'text-violet-400'
          return (
            <div key={i} className={`px-5 py-4 flex items-center gap-4 ${i > 0 ? `border-t ${G.div}` : ''}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${bg}`}>
                {apt.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm leading-snug">{apt.title}</p>
                <p className={`text-xs font-semibold mt-1 ${tc}`}>{apt.date} · {apt.time}</p>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// ── Tab: Finance ──────────────────────────────────────────────────────────────

function FinanceTab() {
  const flaggedCount = TRANSACTIONS.filter(t => t.flagged).length

  return (
    <div className="space-y-5">

      {/* Safety hero */}
      <motion.div className="rounded-2xl p-5 relative overflow-hidden" {...fade(0)}
        style={{ background: 'linear-gradient(140deg, rgba(5,150,105,0.40) 0%, rgba(16,185,129,0.15) 60%, rgba(6,182,212,0.10) 100%)', border: '1px solid rgba(16,185,129,0.20)', boxShadow: '0 0 60px rgba(5,150,105,0.12)' }}>
        <div className="absolute inset-0 backdrop-blur-2xl" />
        <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-emerald-300/60 text-[11px] font-bold uppercase tracking-widest mb-1">Financial Safety</p>
              <p className="text-2xl font-black text-white leading-tight">Accounts<br />Protected 🛡️</p>
              <p className="text-white/35 text-xs mt-1.5">No unauthorized activity</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400">{SCAM.saved}</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wide font-semibold">saved this year</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Scams blocked today', value: SCAM.today,  icon: '🚫' },
              { label: 'Blocked this month',  value: SCAM.month,  icon: '📊' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/[0.08] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-xl font-black text-white leading-none">{value}</p>
                  <p className="text-[10px] text-white/35 font-medium mt-0.5 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bank accounts */}
      <div>
        <Label>Bank Accounts</Label>
        <div className="space-y-3">
          {BANK_ACCOUNTS.map((acct, i) => (
            <motion.div key={acct.last4} className={`${G.card} overflow-hidden`} {...slide(i * 0.07)}>
              {/* card header stripe */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1d4ed8, #6366f1)' }} />
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/25 flex items-center justify-center text-xl flex-shrink-0">🏦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm">{acct.bank} {acct.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">···· ···· ···· {acct.last4} · {acct.updated}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-white">{acct.balance}</p>
                  <Pill color="emerald">Normal</Pill>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <Card delay={0.15} className="overflow-hidden">
        <div className={`px-5 py-3.5 border-b ${G.div} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span>💳</span>
            <p className="font-black text-white text-sm">Recent Transactions</p>
          </div>
          {flaggedCount > 0 && <Pill color="red">⚠ {flaggedCount} flagged</Pill>}
        </div>
        {TRANSACTIONS.map((tx, i) => (
          <motion.div key={tx.id}
            className={`px-5 py-3.5 flex items-center gap-3 ${i > 0 ? `border-t ${G.div}` : ''} ${tx.flagged ? 'bg-red-500/[0.06]' : ''}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${tx.flagged ? 'bg-red-500/20 border border-red-500/30' : tx.positive ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-white/[0.07] border border-white/[0.06]'}`}>
              {tx.flagged ? '🚨' : tx.positive ? '💚' : '💳'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${tx.flagged ? 'text-red-400' : 'text-white'}`}>{tx.desc}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-white/30">{tx.date}</p>
                {tx.note && <Pill color="red">{tx.note}</Pill>}
              </div>
            </div>
            <p className={`text-sm font-black flex-shrink-0 ${tx.positive ? 'text-emerald-400' : tx.flagged ? 'text-red-400' : 'text-white/60'}`}>
              {tx.amount}
            </p>
          </motion.div>
        ))}
      </Card>
    </div>
  )
}

// ── Tab: Alerts ───────────────────────────────────────────────────────────────

function AlertsTab({ alerts }) {
  const urgentCount = alerts.filter(a => a.type === 'high').length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="font-black text-white text-base">{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</p>
        {urgentCount > 0 && <Pill color="red">🔴 {urgentCount} urgent</Pill>}
      </div>
      {alerts.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg font-black text-white">All Clear</p>
          <p className="text-sm text-white/40 mt-1">Nothing needs your attention</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CaregiverDashboard({ alerts }) {
  const [tab, setTab] = useState('overview')
  const urgentCount = alerts.filter(a => a.type === 'high').length

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'health',   label: 'Health',   icon: '💊' },
    { id: 'finance',  label: 'Finance',  icon: '💳' },
    { id: 'alerts',   label: 'Alerts',   icon: '🔔', badge: urgentCount },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(160deg, #07091280 0%, #0d1525 40%, #060a14 100%)' }}>

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-100" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-[30%] -right-40 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-[20%] w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-30 border-b border-white/[0.06] px-5 py-4"
        style={{ background: 'rgba(7,9,18,0.80)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest">Caregiver Dashboard</p>
            <h1 className="text-lg font-black text-white mt-0.5">{PARENT}'s Care</h1>
          </div>
          <Pill color="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Protected</Pill>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[73px] z-30 border-b border-white/[0.06]"
        style={{ background: 'rgba(7,9,18,0.80)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-2xl mx-auto flex relative">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-bold transition-all border-b-2 ${
                tab === t.id ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-white/25 hover:text-white/50'
              }`}>
              <span className="text-base relative leading-none">
                {t.icon}
                {t.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-8">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <OverviewTab alerts={alerts} />
            </motion.div>
          )}
          {tab === 'health' && (
            <motion.div key="hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <HealthTab />
            </motion.div>
          )}
          {tab === 'finance' && (
            <motion.div key="fn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <FinanceTab />
            </motion.div>
          )}
          {tab === 'alerts' && (
            <motion.div key="al" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <AlertsTab alerts={alerts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
