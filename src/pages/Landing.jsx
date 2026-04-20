import { useClerk } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Logo } from '../components/Logo'

const C = {
  ink:      '#1C1917',
  inkMid:   '#2D2A27',
  inkLight: '#6B6560',
  inkMuted: '#A09890',
  cream:    '#EDE8DF',
  creamMid: '#F7F4EF',
  border:   '#E8E2DA',
  sage:     '#8FAF9F',
  gold:     '#E8C890',
  peach:    '#E8A888',
}

function fade(delay = 0) {
  return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

function Orb({ size = 120, style = {} }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <div className="orb-breathe-d2" style={{
        position: 'absolute', inset: -size * 0.2,
        background: 'radial-gradient(circle, rgba(232,168,144,.22) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div className="orb-breathe" style={{
        position: 'absolute', inset: size * 0.1,
        background: 'radial-gradient(circle at 40% 35%, rgba(245,220,205,.95) 0%, rgba(224,170,148,.85) 50%, rgba(200,140,115,.75) 100%)',
        borderRadius: '50%',
        boxShadow: `0 0 ${size * 0.4}px rgba(210,150,120,.25)`,
      }} />
    </div>
  )
}

export default function Landing() {
  const { openSignIn } = useClerk()

  const signIn = () => openSignIn({ afterSignInUrl: '/', afterSignUpUrl: '/' })

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 px-6 sm:px-12 py-4 flex items-center justify-between"
        style={{ background: 'rgba(237,232,223,.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <button
            onClick={signIn}
            className="text-sm font-medium px-5 py-2.5 rounded-full transition-all"
            style={{ color: C.inkLight, background: 'transparent', border: `1.5px solid ${C.border}`, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.ink; e.currentTarget.style.color = C.ink }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.inkLight }}
          >Sign in</button>
          <button
            onClick={signIn}
            className="text-sm font-medium px-5 py-2.5 rounded-full transition-all"
            style={{ background: C.ink, color: C.cream, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.inkMid}
            onMouseLeave={e => e.currentTarget.style.background = C.ink}
          >Get started</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 sm:px-12 pt-20 pb-24 max-w-5xl mx-auto text-center">
        <motion.div {...fade(0)} className="flex justify-center mb-10">
          <Orb size={120} />
        </motion.div>

        <motion.p {...fade(0.1)}
          className="text-[11px] font-semibold uppercase tracking-widest mb-5"
          style={{ color: C.sage }}>
          Peace of mind for families
        </motion.p>

        <motion.h1 {...fade(0.15)}
          className="font-lora text-[42px] sm:text-[60px] font-normal leading-[1.15] mb-6 max-w-3xl mx-auto"
          style={{ color: C.ink }}>
          Your parents are safe.<br />You can breathe now.
        </motion.h1>

        <motion.p {...fade(0.2)}
          className="text-[18px] leading-relaxed mb-10 max-w-xl mx-auto"
          style={{ color: C.inkLight }}>
          Helper is a warm AI companion that watches over aging parents — blocking scams,
          tracking medications, and keeping you informed without being intrusive.
        </motion.p>

        <motion.div {...fade(0.25)} className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={signIn}
            className="text-[16px] font-medium px-10 py-4 rounded-full transition-all"
            style={{ background: C.ink, color: C.cream, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.inkMid}
            onMouseLeave={e => e.currentTarget.style.background = C.ink}
          >
            Set up for your parents →
          </button>
          <button
            className="text-[16px] px-10 py-4 rounded-full transition-all"
            style={{ background: 'transparent', color: C.inkLight, border: `1.5px solid ${C.border}`, cursor: 'default' }}
          >
            Watch a demo
          </button>
        </motion.div>
      </section>

      {/* ── Social proof strip ── */}
      <motion.div {...fade(0.3)}
        className="px-6 py-4 flex items-center justify-center gap-8 flex-wrap border-y"
        style={{ borderColor: C.border, background: C.creamMid }}>
        {[
          { value: '5 min',  label: 'to get started'     },
          { value: '24 / 7', label: 'always watching'    },
          { value: '0',      label: 'contracts or fees'  },
          { value: '100%',   label: 'private by design'  },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="font-lora text-2xl font-medium" style={{ color: C.ink }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Features ── */}
      <section className="px-6 sm:px-12 py-20 max-w-5xl mx-auto">
        <motion.p {...fade(0)} className="text-[11px] font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: C.sage }}>
          What Helper does
        </motion.p>
        <motion.h2 {...fade(0.05)} className="font-lora text-[32px] sm:text-[40px] font-normal text-center mb-14" style={{ color: C.ink }}>
          A companion, not a camera.
        </motion.h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="9" y1="12" x2="11" y2="14" />
                  <line x1="15" y1="10" x2="11" y2="14" />
                </svg>
              ),
              title: 'Scam protection',
              body: 'Helper intercepts Medicare fraud calls, IRS impersonators, and wire transfer scams before they reach your parent — in real time.',
              accent: '#FEF2F2',
              border: '#FCA5A5',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1.5" fill="#059669" stroke="none" />
                </svg>
              ),
              title: 'Medication reminders',
              body: "Helper gently reminds your parents when it's time for their medications — and lets you know when they've taken them.",
              accent: '#EEF5F2',
              border: '#C8E0D4',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="9" y1="10" x2="15" y2="10" />
                  <line x1="9" y1="14" x2="13" y2="14" />
                </svg>
              ),
              title: 'Nightly handoff',
              body: "Every evening you get a plain-English summary of how your parents' day went — mood, activity, anything worth knowing.",
              accent: '#FDF6EC',
              border: '#F0D898',
            },
          ].map(({ icon, title, body, accent, border }) => (
            <motion.div
              key={title}
              {...fade(0.1)}
              className="rounded-2xl p-6"
              style={{ background: accent, border: `1px solid ${border}` }}
            >
              <div className="mb-4">{icon}</div>
              <h3 className="font-lora text-xl font-medium mb-2" style={{ color: C.ink }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.inkLight }}>{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 sm:px-12 py-16 max-w-3xl mx-auto">
        <motion.h2 {...fade(0)} className="font-lora text-[32px] font-normal text-center mb-12" style={{ color: C.ink }}>
          Ready in 5 minutes.
        </motion.h2>
        <div className="space-y-6">
          {[
            { step: '01', title: "Set up your parent's profile", desc: 'Name, interests, medications, emergency contact. Takes 3 minutes per person.' },
            { step: '02', title: 'Helper introduces itself gently', desc: "A warm, calm voice. No tech jargon. At your parents' pace." },
            { step: '03', title: 'You get your first evening update', desc: 'A plain-English summary every night. Sleep better.' },
          ].map(({ step, title, desc }) => (
            <motion.div key={step} {...fade(0.05)} className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: C.ink, color: C.cream }}>
                {step}
              </div>
              <div>
                <p className="font-semibold text-base mb-1" style={{ color: C.ink }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.inkLight }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 sm:px-12 py-20 text-center">
        <motion.div {...fade(0)}
          className="max-w-lg mx-auto rounded-3xl p-10"
          style={{ background: C.ink }}>
          <Orb size={72} style={{ margin: '0 auto 24px' }} />
          <h2 className="font-lora text-[28px] font-normal mb-3" style={{ color: C.cream }}>
            Start protecting your parents today.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(237,232,223,.55)' }}>
            Free to set up. No contracts. Helper is always learning, always watching, always there.
          </p>
          <button
            onClick={signIn}
            className="text-[16px] font-medium px-10 py-4 rounded-full transition-all"
            style={{ background: C.cream, color: C.ink, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.creamMid}
            onMouseLeave={e => e.currentTarget.style.background = C.cream}
          >
            Get started for free →
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 sm:px-12 py-8 flex items-center justify-between border-t flex-wrap gap-4"
        style={{ borderColor: C.border }}>
        <Logo size="sm" />
        <p className="text-xs" style={{ color: C.inkMuted }}>
          © 2026 Helper. Keeping families close.
        </p>
      </footer>

    </div>
  )
}
