import { useState } from 'react'
import VoiceConnect from '../components/VoiceConnect'

const ALERT_STYLES = {
  high: { bar: 'border-helper-red', badge: 'bg-red-100 text-red-700', label: 'URGENT' },
  medium: { bar: 'border-helper-amber', badge: 'bg-amber-100 text-amber-700', label: 'REVIEW' },
  low: { bar: 'border-helper-green', badge: 'bg-green-100 text-green-700', label: 'INFO' },
}

function AlertCard({ alert }) {
  const style = ALERT_STYLES[alert.type] || ALERT_STYLES.low
  return (
    <div className={`alert-card ${style.bar}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
              {style.label}
            </span>
            <span className="text-helper-gray-text text-sm">{alert.time}</span>
          </div>
          <p className="text-elder-base font-bold text-helper-navy">{alert.title}</p>
          <p className="text-elder-sm text-helper-gray-text mt-1">{alert.msg}</p>
        </div>
      </div>
    </div>
  )
}

function WellnessScore({ score = 92 }) {
  const color = score >= 80 ? 'text-helper-green' : score >= 60 ? 'text-helper-amber' : 'text-helper-red'
  const ring = score >= 80 ? 'stroke-helper-green' : score >= 60 ? 'stroke-helper-amber' : 'stroke-helper-red'
  const pct = (score / 100) * 283 // circumference of r=45

  return (
    <div className="card text-center flex flex-col items-center gap-2">
      <p className="text-elder-sm font-bold text-helper-gray-text">Wellness Score</p>
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${pct} 283`}
            strokeLinecap="round"
            className={ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-elder-xl font-black ${color}`}>{score}</span>
          <span className="text-xs text-helper-gray-text">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-helper-green font-semibold">All systems normal</p>
    </div>
  )
}

export default function CaregiverDashboard({ alerts, onAlert }) {
  const [tab, setTab] = useState('overview')
  const urgentCount = alerts.filter(a => a.type === 'high').length

  return (
    <div className="min-h-screen bg-helper-gray-light pb-16">

      {/* Status bar */}
      <div className="bg-helper-navy text-white px-6 py-5">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <p className="text-blue-200 text-sm">Monitoring</p>
            <h1 className="text-elder-lg font-black">Margaret's Safety</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <div className="w-3 h-3 bg-helper-green rounded-full animate-pulse" />
            <span className="text-elder-sm font-semibold text-green-300">Protected</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-helper-gray-mid sticky top-[73px] z-40">
        <div className="flex max-w-2xl mx-auto">
          {['overview', 'alerts', 'voice'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-elder-sm font-bold capitalize transition-all border-b-4 ${
                tab === t
                  ? 'border-helper-blue text-helper-blue'
                  : 'border-transparent text-helper-gray-text hover:text-helper-navy'
              }`}
            >
              {t === 'alerts' && urgentCount > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  Alerts
                  <span className="bg-helper-red text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {urgentCount}
                  </span>
                </span>
              ) : (
                t.charAt(0).toUpperCase() + t.slice(1)
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <WellnessScore score={92} />
              <div className="card flex flex-col justify-between">
                <p className="text-elder-sm font-bold text-helper-gray-text">Today's Activity</p>
                <div className="space-y-3 mt-2">
                  {[
                    { icon: '📞', label: 'Calls screened', value: '3' },
                    { icon: '🛡️', label: 'Scams blocked', value: '1' },
                    { icon: '💊', label: 'Meds confirmed', value: '2' },
                    { icon: '💬', label: 'Voice sessions', value: '1' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-elder-sm text-helper-gray-text flex items-center gap-1.5">
                        {icon} {label}
                      </span>
                      <span className="text-elder-base font-black text-helper-navy">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Latest alert */}
            {alerts[0] && (
              <div>
                <p className="text-elder-sm font-bold text-helper-gray-text mb-3">Latest Alert</p>
                <AlertCard alert={alerts[0]} />
              </div>
            )}

            {/* Quick actions */}
            <div>
              <p className="text-elder-sm font-bold text-helper-gray-text mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-outline text-elder-sm gap-2 py-4 px-4" style={{minHeight: '64px', fontSize: '1rem'}}>
                  <span className="text-2xl">📋</span> Medical Profile
                </button>
                <button className="btn-outline text-elder-sm gap-2 py-4 px-4" style={{minHeight: '64px', fontSize: '1rem'}}>
                  <span className="text-2xl">💳</span> Financial Monitor
                </button>
                <button className="btn-outline text-elder-sm gap-2 py-4 px-4" style={{minHeight: '64px', fontSize: '1rem'}}>
                  <span className="text-2xl">📞</span> Call History
                </button>
                <button className="btn-outline text-elder-sm gap-2 py-4 px-4" style={{minHeight: '64px', fontSize: '1rem'}}>
                  <span className="text-2xl">⚙️</span> Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-elder-base font-black text-helper-navy">
                {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
              </p>
              {urgentCount > 0 && (
                <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">
                  {urgentCount} urgent
                </span>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-5xl mb-4">✅</p>
                <p className="text-elder-lg font-bold text-helper-navy">All Clear</p>
                <p className="text-elder-sm text-helper-gray-text">No alerts to review</p>
              </div>
            ) : (
              alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
            )}
          </div>
        )}

        {/* VOICE TAB - Caregiver can talk to Helper AI too */}
        {tab === 'voice' && (
          <div className="space-y-6">
            <div className="card text-center">
              <p className="text-elder-lg font-black text-helper-navy mb-1">
                Ask Helper Anything
              </p>
              <p className="text-elder-sm text-helper-gray-text">
                Get insights about your parent's safety, financial risks, or medication guidance
              </p>
            </div>
            <VoiceConnect onAlert={onAlert} mode="caregiver" />
          </div>
        )}
      </div>
    </div>
  )
}
