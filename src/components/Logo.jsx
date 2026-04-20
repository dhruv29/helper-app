// LogoMark — stylised "h" where the ascender curves into a protective arch
// The arch shelters the right leg, echoing the product metaphor.

export function LogoMark({ size = 28, color = '#1C1917', accentColor = '#C8856A' }) {
  const s = size / 28   // scale factor relative to 28px design grid
  const sw = 2.4 * s    // stroke weight
  const r  = sw / 2     // cap radius (for dots)

  return (
    <svg
      width={size}
      height={Math.round(size * 32 / 28)}
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left stem — tall ascender */}
      <line
        x1="5" y1="2.5" x2="5" y2="29.5"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />

      {/* Protective arch — cubic bezier peaks above the arch attachment */}
      <path
        d="M 5,14 C 5,3 23,3 23,14"
        stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Right leg */}
      <line
        x1="23" y1="14" x2="23" y2="29.5"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />

      {/* Accent dot at arch apex — the "person being sheltered" */}
      <circle cx="14" cy="3.8" r={sw * 0.85} fill={accentColor} />
    </svg>
  )
}

// Full lockup: mark + wordmark
export function Logo({ size = 'md', dark = false }) {
  const configs = {
    sm: { markSize: 20, textSize: 16, gap: 6 },
    md: { markSize: 26, textSize: 20, gap: 8 },
    lg: { markSize: 34, textSize: 26, gap: 10 },
  }
  const { markSize, textSize, gap } = configs[size] ?? configs.md
  const color = dark ? '#EDE8DF' : '#1C1917'
  const accentColor = dark ? '#E8A888' : '#C8856A'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <LogoMark size={markSize} color={color} accentColor={accentColor} />
      <span style={{
        fontFamily: 'Lora, serif',
        fontSize: textSize,
        fontWeight: 500,
        color,
        letterSpacing: '-0.01em',
        lineHeight: 1,
      }}>
        helper
      </span>
    </div>
  )
}
