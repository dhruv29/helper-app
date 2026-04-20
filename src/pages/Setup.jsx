import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function Setup({ onDone }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    caregiverName: '',
    relationship: '',
    parentName: 'Margaret',
    parentAge: '78',
    parentCity: 'Montclair, NJ',
    healthNotes: '',
    interests: [],
    extraInterests: '',
    emergencyName: '',
    emergencyPhone: '',
  })

  const TOTAL = 4

  const set = (k, v) => setData(p => ({ ...p, [k]: v }))

  const handleDone = (result) => {
    localStorage.setItem('helper_profile', JSON.stringify(result))
    onDone?.(result)
  }

  const steps = [
    <StepWelcome  key="s0" data={data} set={set} />,
    <StepParent   key="s1" data={data} set={set} />,
    <StepInterests key="s2" data={data} set={set} />,
    <StepEmergency key="s3" data={data} set={set} />,
    <StepDone     key="s4" data={data} onDone={handleDone} />,
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #F5EFE6 0%, #EDE8DF 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
        <p className="font-lora text-xl font-medium" style={{ color: '#1C1917' }}>helper</p>
        <p className="text-sm" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>
          {step < TOTAL ? `${step + 1} of ${TOTAL}` : 'All set'}
        </p>
      </div>

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
