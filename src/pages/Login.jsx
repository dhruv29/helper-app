import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

function GoogleButton() {
  const { signIn, isLoaded } = useSignIn()

  const handleGoogle = async () => {
    if (!isLoaded) return
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    })
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl transition-all mb-4"
      style={{
        background: '#fff',
        border: '1.5px solid #E8E2DA',
        color: '#1C1917',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#1C1917'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E2DA'}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      Continue with Google
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: '#E8E2DA' }} />
      <span className="text-xs font-medium" style={{ color: '#A09890', fontFamily: 'DM Sans, sans-serif' }}>or</span>
      <div className="flex-1 h-px" style={{ background: '#E8E2DA' }} />
    </div>
  )
}

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
      <GoogleButton />
      <Divider />
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
      {stage === 'form' && <><GoogleButton /><Divider /></>}
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
