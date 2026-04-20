import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

function InputField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#8A8279' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        className="w-full text-[16px] rounded-xl px-4 py-3.5 outline-none transition-all"
        style={{ background: '#F0EBE2', border: '1.5px solid transparent', color: '#1C1917', fontFamily: 'DM Sans, sans-serif' }}
        onFocus={e => { e.target.style.borderColor = '#1C1917'; e.target.style.background = '#FBF8F4' }}
        onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = '#F0EBE2' }}
      />
    </div>
  )
}

function LoginForm({ onSwitch }) {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError(''); setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      await setActive({ session: result.createdSessionId })
    } catch (err) {
      setError(err.errors?.[0]?.longMessage ?? err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputField label="Email"    type="email"    value={email}    onChange={setEmail}    placeholder="you@example.com" />
      <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <Error msg={error} />
      <SubmitButton loading={loading} label="Sign in" />
      <SwitchMode label="Don't have an account?" action="Sign up" onClick={onSwitch} />
    </form>
  )
}

function SignUpForm({ onSwitch }) {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [code,     setCode]     = useState('')
  const [stage,    setStage]    = useState('form')   // 'form' | 'verify'
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError(''); setLoading(true)
    try {
      if (stage === 'form') {
        await signUp.create({ emailAddress: email, password })
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setStage('verify')
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code })
        await setActive({ session: result.createdSessionId })
      }
    } catch (err) {
      setError(err.errors?.[0]?.longMessage ?? err.message)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {stage === 'form' ? (
        <>
          <InputField label="Email"    type="email"    value={email}    onChange={setEmail}    placeholder="you@example.com" />
          <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        </>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: '#7A7269', fontFamily: 'DM Sans, sans-serif' }}>
            We sent a verification code to <strong>{email}</strong>
          </p>
          <InputField label="Verification code" value={code} onChange={setCode} placeholder="6-digit code" />
        </>
      )}
      <Error msg={error} />
      <SubmitButton loading={loading} label={stage === 'form' ? 'Create account' : 'Verify email'} />
      {stage === 'form' && <SwitchMode label="Already have an account?" action="Sign in" onClick={onSwitch} />}
    </form>
  )
}

function Error({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          className="text-sm mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(192,57,43,.08)', color: '#C0392B', border: '1px solid rgba(192,57,43,.2)', fontFamily: 'DM Sans, sans-serif' }}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        >{msg}</motion.p>
      )}
    </AnimatePresence>
  )
}

function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full text-[16px] font-medium py-4 rounded-full transition-all mb-1"
      style={{
        background: loading ? '#6B6560' : '#1C1917', color: '#EDE8DF',
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >{loading ? '…' : label}</button>
  )
}

function SwitchMode({ label, action, onClick }) {
  return (
    <p className="text-center text-sm mt-5" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>
      {label}{' '}
      <button type="button" onClick={onClick}
        className="font-semibold underline"
        style={{ color: '#6B6560', background: 'none', border: 'none', cursor: 'pointer' }}
      >{action}</button>
    </p>
  )
}

export default function Login() {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #F5EFE6 0%, #EDE8DF 100%)' }}>

      {/* Orb */}
      <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 32 }}>
        <div className="orb-breathe-d2" style={{
          position: 'absolute', inset: -12,
          background: 'radial-gradient(circle, rgba(232,168,144,.28) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div className="orb-breathe" style={{
          position: 'absolute', inset: 8,
          background: 'radial-gradient(circle at 40% 35%, rgba(245,220,205,.9) 0%, rgba(224,170,148,.8) 50%, rgba(200,140,115,.7) 100%)',
          borderRadius: '50%',
        }} />
      </div>

      <h1 className="font-lora text-3xl font-normal mb-1 text-center" style={{ color: '#1C1917' }}>
        {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
      </h1>
      <p className="text-[15px] mb-10 text-center" style={{ color: '#7A7269', fontFamily: 'DM Sans, sans-serif' }}>
        {mode === 'login' ? 'Sign in to your caregiver account.' : 'Start protecting someone you love.'}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
          transition={{ duration: .2 }}
        >
          {mode === 'login'
            ? <LoginForm  onSwitch={() => setMode('signup')} />
            : <SignUpForm onSwitch={() => setMode('login')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
