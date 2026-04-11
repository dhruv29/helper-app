import { useState } from 'react'

export default function Setup() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    seniorName: 'Margaret',
    caregiverName: 'Sarah',
    caregiverPhone: '',
    medications: 'Lisinopril 10mg, Metformin 500mg',
    allergies: 'Penicillin',
    conditions: 'Type 2 Diabetes, Hypertension',
    emergencyDoctor: '',
    bankAlertThreshold: '200',
  })

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    localStorage.setItem('helper_profile', JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen bg-helper-gray-light pb-16">
      <div className="bg-helper-navy text-white px-6 py-6">
        <h1 className="text-elder-xl font-black">Setup Helper</h1>
        <p className="text-blue-200 text-elder-sm mt-1">Set up your parent's protection profile</p>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">

        {/* Senior Profile */}
        <section className="card space-y-4">
          <h2 className="text-elder-base font-black text-helper-navy flex items-center gap-2">
            <span className="text-2xl">👤</span> Parent Profile
          </h2>

          <Field label="Parent's Name" value={form.seniorName}
            onChange={v => update('seniorName', v)} />
          <Field label="Caregiver Name" value={form.caregiverName}
            onChange={v => update('caregiverName', v)} />
          <Field label="Caregiver Phone" value={form.caregiverPhone} type="tel"
            placeholder="+1 (555) 000-0000"
            onChange={v => update('caregiverPhone', v)} />
        </section>

        {/* Medical Profile */}
        <section className="card space-y-4">
          <h2 className="text-elder-base font-black text-helper-navy flex items-center gap-2">
            <span className="text-2xl">🏥</span> Medical Profile
          </h2>

          <TextArea label="Current Medications" value={form.medications}
            placeholder="e.g. Lisinopril 10mg daily, Metformin 500mg twice daily"
            onChange={v => update('medications', v)} />
          <TextArea label="Allergies" value={form.allergies}
            placeholder="e.g. Penicillin, Sulfa drugs"
            onChange={v => update('allergies', v)} />
          <TextArea label="Medical Conditions" value={form.conditions}
            placeholder="e.g. Type 2 Diabetes, Hypertension"
            onChange={v => update('conditions', v)} />
          <Field label="Primary Doctor's Contact" value={form.emergencyDoctor}
            placeholder="Dr. Smith — (555) 000-1234"
            onChange={v => update('emergencyDoctor', v)} />
        </section>

        {/* Financial Protection */}
        <section className="card space-y-4">
          <h2 className="text-elder-base font-black text-helper-navy flex items-center gap-2">
            <span className="text-2xl">💳</span> Financial Protection
          </h2>
          <Field
            label="Alert threshold (USD) — flag transactions above:"
            value={form.bankAlertThreshold}
            type="number"
            placeholder="200"
            onChange={v => update('bankAlertThreshold', v)}
          />
          <p className="text-sm text-helper-gray-text">
            Any transaction above this amount will be flagged for your review.
            Connect your bank account securely via Plaid (coming soon).
          </p>
        </section>

        {/* How it works */}
        <section className="card bg-blue-50 border-2 border-helper-blue space-y-3">
          <h2 className="text-elder-base font-black text-helper-navy">How Helper Protects</h2>
          {[
            ['🎙️', 'Voice Connect', 'Your parent can talk to the AI anytime — it answers questions, detects distress, and flags emergencies.'],
            ['🛡️', 'Scam Interception', 'Incoming calls are screened by AI. Suspected scams are blocked and you\'re notified instantly.'],
            ['💳', 'Financial Monitoring', 'Unusual transactions are flagged before money leaves. You review and approve in real time.'],
            ['💊', 'Medication Alerts', 'Cross-checks against the FDA database to catch dangerous drug combinations.'],
            ['🚨', 'Emergency Button', 'One-tap emergency alerts your entire caregiver network and shares medical profile with 911.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <p className="font-bold text-helper-navy text-elder-sm">{title}</p>
                <p className="text-sm text-helper-gray-text">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`btn-primary w-full ${saved ? 'bg-helper-green' : ''}`}
        >
          <span className="text-3xl">{saved ? '✅' : '💾'}</span>
          <span>{saved ? 'Profile Saved!' : 'Save Profile'}</span>
        </button>

      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-elder-sm font-bold text-helper-navy mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-helper-gray-mid rounded-xl px-4 py-3
                   text-elder-sm text-helper-navy focus:outline-none focus:border-helper-blue
                   bg-white transition-colors"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-elder-sm font-bold text-helper-navy mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full border-2 border-helper-gray-mid rounded-xl px-4 py-3
                   text-elder-sm text-helper-navy focus:outline-none focus:border-helper-blue
                   bg-white resize-none transition-colors"
      />
    </div>
  )
}
