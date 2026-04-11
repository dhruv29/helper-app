import { motion, AnimatePresence } from 'framer-motion'

const CONFIGS = {
  idle: {
    from: '#3B82F6', to: '#6366F1',
    ring: '#BFDBFE', shadow: '#3B82F655',
    label: "I'm here for you",
  },
  listening: {
    from: '#22C55E', to: '#16A34A',
    ring: '#BBF7D0', shadow: '#22C55E55',
    label: 'Listening…',
  },
  thinking: {
    from: '#F59E0B', to: '#D97706',
    ring: '#FDE68A', shadow: '#F59E0B55',
    label: 'Thinking…',
  },
  speaking: {
    from: '#8B5CF6', to: '#7C3AED',
    ring: '#DDD6FE', shadow: '#8B5CF655',
    label: 'Speaking…',
  },
  error: {
    from: '#EF4444', to: '#DC2626',
    ring: '#FECACA', shadow: '#EF444455',
    label: 'Something went wrong',
  },
}

function AvatarFace({ state }) {
  const smileD  = 'M27 50 Q40 62 53 50'
  const frownD  = 'M27 57 Q40 49 53 57'
  const neutralD = 'M30 53 Q40 57 50 53'

  const mouthPath =
    state === 'error' ? frownD :
    state === 'listening' ? neutralD : smileD

  return (
    <svg viewBox="0 0 80 80" width="88" height="88" fill="none">
      {/* Left eye */}
      <circle cx="28" cy="32" r="6" fill="white" opacity="0.92" />
      <circle cx="29.5" cy="33.5" r="2.8" fill="rgba(0,0,60,0.32)" />

      {/* Right eye */}
      <circle cx="52" cy="32" r="6" fill="white" opacity="0.92" />
      <circle cx="53.5" cy="33.5" r="2.8" fill="rgba(0,0,60,0.32)" />

      {/* Mouth */}
      {state === 'speaking' ? (
        <motion.ellipse
          cx="40" cy="54" rx="11" ry="7.5"
          fill="white" opacity="0.88"
          animate={{ ry: [7.5, 4, 7.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      ) : state === 'thinking' ? (
        <g opacity="0.85">
          {[31, 40, 49].map((cx, i) => (
            <motion.circle
              key={cx} cx={cx} cy="55" r="3.5" fill="white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </g>
      ) : (
        <motion.path
          d={mouthPath}
          stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.88"
          animate={{ d: mouthPath }}
          transition={{ duration: 0.3 }}
        />
      )}
    </svg>
  )
}

export default function SarahAvatar({ voiceState = 'idle' }) {
  const cfg = CONFIGS[voiceState] || CONFIGS.idle
  const isActive = voiceState !== 'idle' && voiceState !== 'error'

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>

        {/* Ping ring — listening only */}
        <AnimatePresence>
          {voiceState === 'listening' && (
            <motion.div
              className="absolute rounded-full"
              style={{ width: 220, height: 220, backgroundColor: cfg.ring }}
              initial={{ scale: 0.85, opacity: 0.7 }}
              animate={{ scale: 1.55, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Middle pulse ring */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 196, height: 196 }}
          animate={{
            backgroundColor: cfg.ring,
            opacity: isActive ? 0.5 : 0.2,
            scale: voiceState === 'speaking' ? [1, 1.06, 1] : 1,
          }}
          transition={{
            backgroundColor: { duration: 0.5 },
            scale: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Main circle */}
        <motion.div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 168, height: 168,
            background: `linear-gradient(145deg, ${cfg.from}, ${cfg.to})`,
          }}
          animate={{ boxShadow: `0 20px 60px ${cfg.shadow}` }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <AvatarFace state={voiceState} />
        </motion.div>
      </div>

      {/* Name + label */}
      <div className="text-center">
        <p className="text-2xl font-black text-helper-navy tracking-tight">Sarah</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={cfg.label}
            className="text-sm text-helper-gray-text font-medium mt-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {cfg.label}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
