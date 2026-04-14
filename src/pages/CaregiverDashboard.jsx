import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Mock data ─────────────────────────────────────────────────────────────────

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
  { name: 'Checking', bank: 'Chase', last4: '4821', balance: '$2,847', status: 'normal', updated: '2 hrs ago'  },
  { name: 'Savings',  bank: 'Chase', last4: '3902', balance: '$18,340', status: 'normal', updated: '3 days ago' },
]

const TRANSACTIONS = [
  { id: 1, desc: 'Walgreens Pharmacy',    amount: '-$24.50',    date: 'Today, 10:30 AM', flagged: false, positive: false },
  { id: 2, desc: 'Wire Transfer Attempt', amount: '-$450.00',   date: 'Today, 9:15 AM',  flagged: true,  positive: false, note: 'Blocked by Helper' },
  { id: 3, desc: 'Social Security',        amount: '+$1,842.00', date: 'Yesterday',       flagged: false, positive: true  },
  { id: 4, desc: 'Medicare Premium',       amount: '-$170.10',   date: 'Apr 11',           flagged: false, positive: false },
  { id: 5, desc: 'Publix Supermarket',     amount: '-$67.23',    date: 'Apr 11',           flagged: false, positive: false },
]

const SCAM = { today: 1, month: 7, saved: '$2,350' }

const ACTIVITY = {
  lastSeen: '2 hours ago', sessions: 3, weeklyAvg: 4.2, streak: 8,
  weekBars: [3, 2, 4, 1, 3, 4, 3],
}

const APPOINTMENTS = [
  { title: 'Dr. Johnson — Primary Care', date: 'Tue, Apr 15', time: '2:00 PM', icon: '🩺' },
  { title: 'Blood Panel Lab Work',        date: 'Thu, Apr 17', time: '9:00 AM', icon: '🔬' },
]

// ── Shared components ─────────────────────────────────────────────────────────

const ALERT_STYLES = {
  high:   { border: 'border-l-red-500',   badge: 'bg-red-100 text-red-700',     label: 'URGENT' },
  medium: { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700', label: 'REVIEW' },
  low:    { border: 'border-l-green-400', badge: 'bg-green-100 text-green-700', label: 'INFO'   },
}

function AlertCard({ alert, index = 0 }) {
  const s = ALERT_STYLES[alert.type] || ALERT_STYLES.low
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${s.border} p-4`}
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
            <span className="text-xs text-gray-400">{alert.time}</span>
          </div>
          <p className="font-bold text-gray-900 text-sm">{alert.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{alert.msg}</p>
        </div>
      </div>
    </motion.div>
  )
}

function WellnessRing({ score }) {
  const pct = (score / 100) * 283
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Great' : score >= 60 ? 'Fair' : 'At Risk'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${pct} 283`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900">{score}</span>
        </div>
      </div>
      <p className="text-xs font-bold" style={{ color }}>{label}</p>
    </div>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ alerts }) {
  const taken   = MEDICATIONS.filter(m => m.taken).length
  const total   = MEDICATIONS.length
  const urgent  = alerts.filter(a => a.type === 'high')

  return (
    <div className="space-y-4">

      {/* Hero status */}
      <motion.div
        className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Today's Status</p>
            <h2 className="text-xl font-black">{PARENT} is doing well</h2>
            <p className="text-blue-300 text-xs mt-1">Last active {ACTIVITY.lastSeen}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-2.5 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-xs font-bold">Safe</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Meds',    value: `${taken}/${total}`, warn: taken < total },
            { label: 'Blocked', value: SCAM.today,          warn: false         },
            { label: 'Sessions',value: ACTIVITY.sessions,   warn: false         },
            { label: 'Streak',  value: `${ACTIVITY.streak}d`, warn: false       },
          ].map(({ label, value, warn }) => (
            <div key={label} className={`rounded-xl p-2.5 text-center ${warn ? 'bg-amber-500/30 border border-amber-400/40' : 'bg-white/10'}`}>
              <p className={`text-lg font-black leading-none ${warn ? 'text-amber-200' : 'text-white'}`}>{value}</p>
              <p className="text-blue-200 text-[10px] font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Wellness + Mood */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-start">Wellness</p>
          <WellnessRing score={92} />
        </motion.div>
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Mood</p>
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl mb-2">😊</div>
            <p className="font-bold text-gray-900 text-sm">Calm &amp; positive</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">Based on today's conversations</p>
          </div>
        </motion.div>
      </div>

      {/* Medication quick view */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💊</span>
            <p className="font-bold text-gray-900 text-sm">Medications Today</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${taken === total ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {taken}/{total} taken
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {MEDICATIONS.map(med => (
            <div key={med.id} className="px-5 py-3 flex items-center gap-3">
              <span className="text-base flex-shrink-0">{med.taken ? '✅' : '⏰'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{med.name}</p>
                <p className="text-xs text-gray-400">{med.taken ? `Taken at ${med.takenAt}` : `Due at ${med.time}`}</p>
              </div>
              {!med.taken && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* App activity */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      >
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">App Activity This Week</p>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          {[
            { label: 'Sessions today', value: ACTIVITY.sessions },
            { label: 'Weekly avg',     value: ACTIVITY.weeklyAvg },
            { label: 'Day streak',     value: `${ACTIVITY.streak}d` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-black text-indigo-600">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-10">
          {ACTIVITY.weekBars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div className="rounded-sm bg-indigo-400" style={{ height: `${(h / 4) * 100}%`, minHeight: 4 }} />
            </div>
          ))}
        </div>
        <div className="flex mt-1">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} className="flex-1 text-center text-[9px] text-gray-300 font-medium">{d}</span>
          ))}
        </div>
      </motion.div>

      {/* Urgent alerts */}
      {urgent.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Urgent Alerts</p>
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
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💊</span>
              <h3 className="font-black text-gray-900">Medications</h3>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${adherence === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {adherence}% today
            </span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {MEDICATIONS.map(m => (
              <div key={m.id} className={`h-2 flex-1 rounded-full transition-colors ${m.taken ? 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-gray-400">{taken} of {MEDICATIONS.length} doses taken today</p>
            <p className="text-xs font-semibold text-green-600">7-day streak ✨</p>
          </div>
        </div>
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {MEDICATIONS.map((med, i) => (
            <motion.div
              key={med.id}
              className="px-5 py-4 flex items-center gap-4"
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${med.taken ? 'bg-green-100' : 'bg-amber-50'}`}>
                {med.taken ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{med.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{med.note} · Scheduled {med.time}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {med.taken
                  ? <p className="text-xs font-bold text-green-600">✓ {med.takenAt}</p>
                  : <p className="text-xs font-bold text-amber-500">Pending</p>
                }
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Vitals */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Vitals · Last recorded Apr 12
        </p>
        <div className="grid grid-cols-2 gap-3">
          {VITALS.map((v, i) => (
            <motion.div
              key={v.label}
              className={`bg-white rounded-2xl shadow-sm border p-4 ${!v.good ? 'border-amber-200' : 'border-gray-100'}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{v.icon}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${v.good ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {v.trend === 0 ? '→ Stable' : v.trend > 0 ? `↑ +${v.trend}` : `↓ ${v.trend}`}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none">{v.value}</p>
              <p className="text-xs text-gray-500 mt-1">{v.label}</p>
              <p className="text-[10px] text-gray-300">{v.unit}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <span>📅</span>
          <p className="font-bold text-gray-900 text-sm">Upcoming Appointments</p>
        </div>
        {APPOINTMENTS.map((apt, i) => (
          <div key={i} className={`px-5 py-4 flex items-center gap-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">
              {apt.icon}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{apt.title}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">{apt.date} · {apt.time}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Tab: Finance ──────────────────────────────────────────────────────────────

function FinanceTab() {
  const flaggedCount = TRANSACTIONS.filter(t => t.flagged).length

  return (
    <div className="space-y-5">

      {/* Safety hero */}
      <motion.div
        className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Financial Safety</p>
            <p className="text-xl font-black">Accounts Protected</p>
            <p className="text-emerald-200 text-xs mt-1">No unauthorized activity</p>
          </div>
          <span className="text-4xl">🛡️</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Blocked today',  value: SCAM.today    },
            { label: 'This month',     value: SCAM.month    },
            { label: 'Amount saved',   value: SCAM.saved    },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-lg font-black">{value}</p>
              <p className="text-emerald-200 text-[10px] font-medium mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bank accounts */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Bank Accounts</p>
        <div className="space-y-3">
          {BANK_ACCOUNTS.map((acct, i) => (
            <motion.div
              key={acct.last4}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🏦</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{acct.bank} {acct.name}</p>
                <p className="text-xs text-gray-400">···· {acct.last4} · Updated {acct.updated}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900">{acct.balance}</p>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Normal</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
      >
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💳</span>
            <p className="font-bold text-gray-900 text-sm">Recent Transactions</p>
          </div>
          {flaggedCount > 0 && (
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {flaggedCount} flagged
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={tx.id}
              className={`px-5 py-3.5 flex items-center gap-3 ${tx.flagged ? 'bg-red-50' : ''}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.18 + i * 0.04 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${tx.flagged ? 'bg-red-100' : tx.positive ? 'bg-green-100' : 'bg-gray-100'}`}>
                {tx.flagged ? '🚨' : tx.positive ? '⬆️' : '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${tx.flagged ? 'text-red-700' : 'text-gray-900'}`}>{tx.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                {tx.note && <p className="text-[10px] font-bold text-red-500 mt-0.5">{tx.note}</p>}
              </div>
              <p className={`text-sm font-black flex-shrink-0 ${tx.positive ? 'text-green-600' : tx.flagged ? 'text-red-600' : 'text-gray-700'}`}>
                {tx.amount}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ── Tab: Alerts ───────────────────────────────────────────────────────────────

function AlertsTab({ alerts }) {
  const urgentCount = alerts.filter(a => a.type === 'high').length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-black text-gray-900">{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</p>
        {urgentCount > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
            {urgentCount} urgent
          </span>
        )}
      </div>
      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg font-black text-gray-900">All Clear</p>
          <p className="text-sm text-gray-400 mt-1">No alerts to review</p>
        </div>
      ) : (
        alerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CaregiverDashboard({ alerts, onAlert }) {
  const [tab, setTab] = useState('overview')
  const urgentCount = alerts.filter(a => a.type === 'high').length

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'health',   label: 'Health',   icon: '💊' },
    { id: 'finance',  label: 'Finance',  icon: '💳' },
    { id: 'alerts',   label: 'Alerts',   icon: '🔔', badge: urgentCount },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Caregiver Dashboard</p>
            <h1 className="text-lg font-black text-gray-900">{PARENT}'s Care</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-bold">Protected</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-40">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
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
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewTab alerts={alerts} />
            </motion.div>
          )}
          {tab === 'health' && (
            <motion.div key="hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HealthTab />
            </motion.div>
          )}
          {tab === 'finance' && (
            <motion.div key="fn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FinanceTab />
            </motion.div>
          )}
          {tab === 'alerts' && (
            <motion.div key="al" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AlertsTab alerts={alerts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
