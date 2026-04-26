import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../components/Logo'
import { api } from '../lib/api.js'

// ── Shared field primitives ────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#8A8279' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[17px] rounded-xl px-4 py-3.5 outline-none transition-all"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          color: '#1C1917',
          background: '#F0EBE2',
          border: '1.5px solid transparent',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#1C1917'
          e.target.style.background = '#FBF8F4'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'transparent'
          e.target.style.background = '#F0EBE2'
        }}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#8A8279' }}>{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        className="w-full text-[17px] rounded-xl px-4 py-3.5 outline-none resize-none transition-all"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          color: '#1C1917',
          background: '#F0EBE2',
          border: '1.5px solid transparent',
          lineHeight: 1.5,
        }}
        onFocus={e => {
          e.target.style.borderColor = '#1C1917'
          e.target.style.background = '#FBF8F4'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'transparent'
          e.target.style.background = '#F0EBE2'
        }}
      />
    </div>
  )
}

// ── Interest tags ──────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  'Gardening','Cooking','Reading','Jazz','Family photos',
  'TV shows','Crosswords','Walking','Birdwatching','Knitting',
  'Bridge','Grandchildren','Sewing','Puzzles',
]

// ── Step components ────────────────────────────────────────────────────────────

function StepWelcome({ data, set }) {
  return (
    <div>
      <div className="mb-6">
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 24 }}>
          <div style={{
            position: 'absolute', inset: 8,
            background: 'radial-gradient(circle at 40% 35%, rgba(245,220,205,.9) 0%, rgba(224,170,148,.8) 50%, rgba(200,140,115,.7) 100%)',
            borderRadius: '50%',
          }} className="orb-breathe" />
          <div style={{
            position: 'absolute', inset: -10,
            background: 'radial-gradient(circle, rgba(232,168,144,.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }} className="orb-breathe-d2" />
        </div>
        <h2 className="font-lora text-[28px] font-normal leading-snug mb-2" style={{ color: '#1C1917' }}>
          Set up Helper for your parent.
        </h2>
        <p className="text-[15px] leading-relaxed" style={{ color: '#7A7269' }}>
          A few minutes now means peace of mind every day.
        </p>
      </div>
      <Field
        label="Your name"
        value={data.caregiverName}
        onChange={v => set('caregiverName', v)}
        placeholder="e.g. Sarah"
      />
      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: '#8A8279' }}>Your relationship</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {['Daughter', 'Son', 'Partner', 'Friend', 'Other'].map(r => (
            <button
              key={r}
              onClick={() => set('relationship', r)}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{
                border: `1.5px solid ${data.relationship === r ? '#1C1917' : '#C8C0B4'}`,
                background: data.relationship === r ? '#1C1917' : 'transparent',
                color: data.relationship === r ? '#EDE8DF' : '#6B6560',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >{r}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepParent({ data, set }) {
  return (
    <div>
      <h2 className="font-lora text-[28px] font-normal leading-snug mb-1" style={{ color: '#1C1917' }}>
        Tell us about your parent.
      </h2>
      <p className="text-[15px] mb-6" style={{ color: '#7A7269' }}>
        Helper greets them by name and remembers what you share.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="First name" value={data.parentName} onChange={v => set('parentName', v)} placeholder="e.g. Margaret" />
        </div>
        <div style={{ flex: '0 0 90px' }}>
          <Field label="Age" value={data.parentAge} onChange={v => set('parentAge', v)} placeholder="78" />
        </div>
      </div>
      <Field label="City / Location" value={data.parentCity} onChange={v => set('parentCity', v)} placeholder="e.g. Montclair, NJ" />
      <TextArea
        label="Health notes (optional)"
        value={data.healthNotes}
        onChange={v => set('healthNotes', v)}
        placeholder="e.g. hip pain, takes blood pressure medication, allergic to penicillin…"
      />
    </div>
  )
}

function StepInterests({ data, set }) {
  const toggle = (interest) => {
    const current = data.interests
    set('interests', current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest])
  }
  return (
    <div>
      <h2 className="font-lora text-[28px] font-normal leading-snug mb-1" style={{ color: '#1C1917' }}>
        What does {data.parentName || 'your parent'} enjoy?
      </h2>
      <p className="text-[15px] mb-5" style={{ color: '#7A7269' }}>
        Helper will weave these into conversation naturally — never a survey, always a friend.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {INTEREST_OPTIONS.map(i => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{
              border: `1.5px solid ${data.interests.includes(i) ? '#1C1917' : '#C8C0B4'}`,
              background: data.interests.includes(i) ? '#1C1917' : 'transparent',
              color: data.interests.includes(i) ? '#EDE8DF' : '#6B6560',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >{i}</button>
        ))}
      </div>
      <Field
        label="Anything else?"
        value={data.extraInterests || ''}
        onChange={v => set('extraInterests', v)}
        placeholder="e.g. loves the New York Times, has a cat named Biscuit…"
      />
    </div>
  )
}

function StepMedications({ data, set }) {
  const meds = data.medications || []

  const addMed = () => set('medications', [...meds, { name: '', dose: '', schedule: 'Morning' }])
  const removeMed = (i) => set('medications', meds.filter((_, idx) => idx !== i))
  const updateMed = (i, field, val) => set('medications', meds.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const SCHEDULES = ['Morning', 'Afternoon', 'Evening', 'Morning, Evening', 'Morning, Afternoon, Evening']

  return (
    <div>
      <h2 className="font-lora text-[28px] font-normal leading-snug mb-1" style={{ color: '#1C1917' }}>
        Medications
      </h2>
      <p className="text-[15px] mb-5" style={{ color: '#7A7269' }}>
        Helper will remind {data.parentName || 'your parent'} and let you know when they've taken them.
      </p>

      <div className="space-y-3 mb-4">
        {meds.map((med, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: '#F0EBE2' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A8279' }}>Medication {i + 1}</p>
              <button onClick={() => removeMed(i)}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ color: '#C0392B', background: 'rgba(192,57,43,.08)' }}>
                Remove
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <input
                  value={med.name} onChange={e => updateMed(i, 'name', e.target.value)}
                  placeholder="e.g. Metformin"
                  className="w-full text-[15px] rounded-xl px-3 py-2.5 outline-none"
                  style={{ background: '#FBF8F4', border: '1.5px solid #1C1917', fontFamily: 'DM Sans, sans-serif', color: '#1C1917' }}
                />
              </div>
              <div style={{ width: 90 }}>
                <input
                  value={med.dose} onChange={e => updateMed(i, 'dose', e.target.value)}
                  placeholder="500mg"
                  className="w-full text-[15px] rounded-xl px-3 py-2.5 outline-none"
                  style={{ background: '#FBF8F4', border: '1.5px solid #1C1917', fontFamily: 'DM Sans, sans-serif', color: '#1C1917' }}
                />
              </div>
            </div>
            <select
              value={med.schedule} onChange={e => updateMed(i, 'schedule', e.target.value)}
              className="w-full text-[14px] rounded-xl px-3 py-2.5 outline-none"
              style={{ background: '#FBF8F4', border: '1.5px solid transparent', fontFamily: 'DM Sans, sans-serif', color: '#1C1917' }}
            >
              {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      <button onClick={addMed}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all"
        style={{ border: '1.5px dashed #C8C0B4', color: '#6B6560', background: 'transparent', fontFamily: 'DM Sans, sans-serif' }}>
        + Add medication
      </button>

      {meds.length === 0 && (
        <p className="text-center text-sm mt-4" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>
          No medications yet — you can add them anytime.
        </p>
      )}
    </div>
  )
}

function StepEmergency({ data, set }) {
  return (
    <div>
      <h2 className="font-lora text-[28px] font-normal leading-snug mb-1" style={{ color: '#1C1917' }}>
        Who should we call in an emergency?
      </h2>
      <p className="text-[15px] mb-6" style={{ color: '#7A7269' }}>
        If {data.parentName || 'your parent'} presses the HELP button and you don't respond within 2 minutes,
        we call this person next.
      </p>
      <Field label="Contact name" value={data.emergencyName} onChange={v => set('emergencyName', v)} placeholder="e.g. James Chen" />
      <Field label="Phone number" value={data.emergencyPhone} onChange={v => set('emergencyPhone', v)} type="tel" placeholder="+1 (555) 000-0000" />
      <div className="mt-2 p-4 rounded-xl"
        style={{ background: 'rgba(232,200,144,.15)', border: '1px solid rgba(232,200,144,.45)' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#6B6560', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ color: '#5A5248' }}>Your privacy matters.</strong> Helper never transcribes or stores
          your parent's conversations. We only share what our AI editorially decides is worth flagging.
        </p>
      </div>
    </div>
  )
}

const NOTIFY_ICONS = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  push: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  email: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  all: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
}

function StepNotifications({ data, set }) {
  const OPTIONS = [
    { id: 'dashboard', label: 'Dashboard',        desc: 'View alerts in your caregiver dashboard',  available: true  },
    { id: 'push',      label: 'Mobile push',       desc: 'Push notifications on your phone',         available: false },
    { id: 'email',     label: 'Email',             desc: 'Receive alerts by email',                  available: false },
    { id: 'all',       label: 'All channels',      desc: 'Dashboard, push, and email combined',      available: false },
  ]
  const selected = data.notifyVia || 'dashboard'
  return (
    <div>
      <h2 className="font-lora text-[28px] font-normal leading-snug mb-1" style={{ color: '#1C1917' }}>
        How should we notify you?
      </h2>
      <p className="text-[15px] mb-6" style={{ color: '#7A7269' }}>
        When Helper flags something important, we'll reach you here.
      </p>
      <div className="space-y-3">
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => set('notifyVia', opt.id)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all"
              style={{
                background: isSelected ? '#1C1917' : '#F0EBE2',
                border:     `1.5px solid ${isSelected ? '#1C1917' : '#C8C0B4'}`,
                fontFamily: 'DM Sans, sans-serif',
                cursor:     'pointer',
              }}
            >
              <span style={{ color: isSelected ? '#EDE8DF' : '#6B6560', flexShrink: 0 }}>
                {NOTIFY_ICONS[opt.id]}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold" style={{ color: isSelected ? '#EDE8DF' : '#1C1917' }}>
                    {opt.label}
                  </p>
                  {!opt.available && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: isSelected ? 'rgba(237,232,223,.15)' : 'rgba(28,25,23,.08)', color: isSelected ? 'rgba(237,232,223,.6)' : '#8A8279' }}>
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-[13px] mt-0.5" style={{ color: isSelected ? 'rgba(237,232,223,.6)' : '#8A8279' }}>
                  {opt.desc}
                </p>
              </div>
              {isSelected && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EDE8DF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDone({ data, onDone }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 28 }}>
        <div className="orb-breathe-d2" style={{
          position: 'absolute', inset: -15,
          background: 'radial-gradient(circle, rgba(232,168,144,.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div className="orb-breathe" style={{
          position: 'absolute', inset: 10,
          background: 'radial-gradient(circle at 40% 35%, rgba(245,220,205,.9) 0%, rgba(224,170,148,.8) 50%, rgba(200,140,115,.7) 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(210,150,120,.4)',
        }} />
      </div>
      <h2 className="font-lora text-3xl font-normal mb-3" style={{ color: '#1C1917' }}>Helper is ready.</h2>
      <p className="text-[16px] leading-relaxed mb-8 max-w-xs" style={{ color: '#7A7269' }}>
        We'll introduce Helper to {data.parentName || 'your parent'} gently — at their pace, on their terms.
        You'll get your first evening Handoff tonight.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => onDone({ ...data, view: 'senior' })}
          className="text-[16px] font-medium px-8 py-4 rounded-full transition-all"
          style={{ background: '#1C1917', color: '#EDE8DF', fontFamily: 'DM Sans, sans-serif' }}
        >
          Open {data.parentName}'s app →
        </button>
        <button
          onClick={() => onDone({ ...data, view: 'caregiver' })}
          className="text-[16px] px-8 py-4 rounded-full transition-all"
          style={{
            background: 'transparent',
            color: '#6B6560',
            border: '1.5px solid #C8C0B4',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Go to my dashboard
        </button>
      </div>
    </div>
  )
}

// ── Main onboarding component ──────────────────────────────────────────────────

export default function Setup({ onDone, existingProfile }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(existingProfile ?? {
    caregiverName: '',
    relationship: '',
    parentName: '',
    parentAge: '',
    parentCity: '',
    healthNotes: '',
    interests: [],
    extraInterests: '',
    medications: [],
    emergencyName: '',
    emergencyPhone: '',
    notifyVia: 'dashboard',
  })

  useEffect(() => {
    if (!existingProfile?.seniorId) return
    api.medications.list(existingProfile.seniorId).then(meds => {
      if (meds?.length) {
        set('medications', meds.map(m => ({ id: m.id, name: m.name, dose: m.dose || '', schedule: m.schedule || 'Morning' })))
      }
    }).catch(() => {})
  }, [existingProfile?.seniorId])

  const TOTAL = 6

  const set = (k, v) => setData(p => ({ ...p, [k]: v }))

  const handleDone = (result) => {
    onDone?.(result)
  }

  const steps = [
    <StepWelcome       key="s0" data={data} set={set} />,
    <StepParent        key="s1" data={data} set={set} />,
    <StepInterests     key="s2" data={data} set={set} />,
    <StepMedications   key="s3" data={data} set={set} />,
    <StepEmergency     key="s4" data={data} set={set} />,
    <StepNotifications key="s5" data={data} set={set} />,
    <StepDone          key="s6" data={data} onDone={handleDone} />,
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #F5EFE6 0%, #EDE8DF 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          {existingProfile?.parentName && (
            <button
              onClick={() => onDone?.({ ...existingProfile, view: 'caregiver', _cancel: true })}
              className="text-sm transition-colors"
              style={{ color: '#A09890', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >← Back to dashboard</button>
          )}
          <p className="text-sm" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>
            {step < TOTAL ? `${step + 1} of ${TOTAL}` : 'All set'}
          </p>
        </div>
      </div>

      {/* Existing profile banner */}
      {existingProfile?.parentName && step < TOTAL && (
        <div className="mx-6 sm:mx-10 mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(28,25,23,.06)', border: '1px solid rgba(28,25,23,.1)' }}>
          <span className="text-lg">👤</span>
          <p className="text-sm flex-1" style={{ color: '#6B6560', fontFamily: 'DM Sans, sans-serif' }}>
            Currently enrolled: <strong style={{ color: '#1C1917' }}>{existingProfile.parentName}</strong>
          </p>
          <p className="text-xs" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>Editing</p>
        </div>
      )}

      {/* Progress bar */}
      {step < TOTAL && (
        <div className="mx-6 sm:mx-10 mt-5 h-[3px] rounded-full overflow-hidden" style={{ background: '#D8D0C4' }}>
          <motion.div
            className="h-full rounded-full ob-progress-fill"
            style={{ background: '#1C1917', width: `${((step + 1) / TOTAL) * 100}%` }}
            layout
          />
        </div>
      )}

      {/* Step body */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-6 max-w-lg w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: .25 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {step < TOTAL && (
        <div className="flex items-center justify-between px-6 sm:px-10 pb-8">
          <button
            onClick={() => step > 0 && setStep(s => s - 1)}
            className="text-[15px] transition-colors"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: step > 0 ? '#A09890' : 'transparent',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >← Back</button>
          <button
            onClick={() => setStep(s => s + 1)}
            className="text-[16px] font-medium px-10 py-4 rounded-full transition-all"
            style={{
              background: '#1C1917', color: '#EDE8DF',
              border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => e.target.style.background = '#2D2A27'}
            onMouseLeave={e => e.target.style.background = '#1C1917'}
          >
            {step === TOTAL - 1 ? 'Finish setup' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}
