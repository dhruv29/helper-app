import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
}

function saveToLocalStorage(history) {
  try {
    const stored = JSON.parse(localStorage.getItem('helper_history') || '[]')
    const today = new Date().toDateString()
    const exchanges = []
    for (let i = 0; i + 1 < history.length; i += 2) {
      if (history[i]?.role === 'user' && history[i + 1]?.role === 'assistant') {
        exchanges.push({ user: history[i].content, sarah: history[i + 1].content })
      }
    }
    const idx = stored.findIndex(s => new Date(s.date).toDateString() === today)
    const session = {
      id: idx >= 0 ? stored[idx].id : `s_${Date.now()}`,
      date: new Date().toISOString(),
      exchanges,
    }
    if (idx >= 0) stored[idx] = session
    else stored.unshift(session)
    localStorage.setItem('helper_history', JSON.stringify(stored.slice(0, 30)))
  } catch { /* ignore */ }
}

function ChatBubble({ role, content, isLive, isTyping }) {
  const isUser = role === 'user'
  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-black text-xs mr-3 mt-1 shadow-md">
          S
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-5 py-3 shadow-sm ${
          isUser
            ? 'bg-helper-navy text-white rounded-br-md'
            : 'bg-white border border-gray-100 text-helper-navy rounded-bl-md'
        } ${isLive ? 'opacity-65' : ''}`}
      >
        {isTyping ? (
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-helper-gray-text rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[1.05rem] leading-relaxed">{content}</p>
        )}
      </div>
    </motion.div>
  )
}

const VoiceConnect = forwardRef(function VoiceConnect(
  { onAlert, mode = 'senior', onStateChange, compact = false },
  ref
) {
  const [voiceState, setVoiceState] = useState(STATES.IDLE)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [textInput, setTextInput] = useState('')

  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const abortRef = useRef(false)
  const chatEndRef = useRef(null)

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(voiceState)
  }, [voiceState, onStateChange])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, response, transcript])

  // Set up speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        recognition.stop()
        sendToHelper(text, true) // fromVoice
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setVoiceState(STATES.IDLE)
        setTranscript('')
      } else {
        setVoiceState(STATES.ERROR)
      }
    }

    recognition.onend = () => {
      if (voiceState === STATES.LISTENING) setVoiceState(STATES.THINKING)
    }

    recognitionRef.current = recognition
  }, [])

  const stripForSpeech = (text) =>
    text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]/gu, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim()

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85   // slightly slower — warm, unhurried
      utterance.pitch = 1.05  // slightly higher — friendly, not flat
      utterance.volume = 1.0

      // Pick best available voice — prefer premium/enhanced Mac voices
      const voices = synthRef.current.getVoices()
      const PREFERRED = ['Ava', 'Nicky', 'Allison', 'Samantha', 'Karen', 'Victoria', 'Susan']
      const pick = PREFERRED.reduce(
        (found, name) => found || voices.find(v => v.name.includes(name) && v.lang.startsWith('en')),
        null
      )
      if (pick) utterance.voice = pick

      utterance.onend = resolve
      utterance.onerror = resolve
      synthRef.current.speak(utterance)
    })
  }, [])

  const sendToHelper = async (userText, fromVoice = false) => {
    if (!userText?.trim()) { setVoiceState(STATES.IDLE); return }

    setVoiceState(STATES.THINKING)
    setResponse('')
    abortRef.current = false

    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: userText },
    ]
    setConversationHistory(newHistory)

    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: conversationHistory, mode }),
      })
      if (!res.ok) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      setVoiceState(STATES.SPEAKING)

      while (true) {
        const { done, value } = await reader.read()
        if (done || abortRef.current) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) { fullResponse += parsed.text; setResponse(fullResponse) }
            if (parsed.alert) onAlert?.(parsed.alert)
          } catch { /* partial chunk */ }
        }
      }

      const finalHistory = [...newHistory, { role: 'assistant', content: fullResponse }]
      setConversationHistory(finalHistory)
      saveToLocalStorage(finalHistory)
      setResponse('') // clear live bubble — message is now in history

      if (fromVoice && fullResponse && !abortRef.current) {
        await speak(stripForSpeech(fullResponse))
      }
      setVoiceState(STATES.IDLE)
    } catch (err) {
      console.error(err)
      setVoiceState(STATES.ERROR)
      setResponse('Sorry, something went wrong. Please try again.')
      if (fromVoice) await speak('Sorry, something went wrong. Please try again.')
      setVoiceState(STATES.IDLE)
    }
  }

  const handleButtonPress = () => {
    synthRef.current.cancel()

    if (voiceState === STATES.LISTENING) {
      recognitionRef.current?.stop()
      setVoiceState(STATES.IDLE)
      setTranscript('')
      return
    }
    if (voiceState === STATES.THINKING || voiceState === STATES.SPEAKING) {
      abortRef.current = true
      synthRef.current.cancel()
      setVoiceState(STATES.IDLE)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setResponse('Voice is not supported in this browser. Please use Chrome or Safari.')
      return
    }

    setTranscript('')
    setResponse('')
    setVoiceState(STATES.LISTENING)
    try {
      recognitionRef.current?.start()
    } catch {
      recognitionRef.current?.stop()
      setTimeout(() => recognitionRef.current?.start(), 200)
    }
  }

  const clearHistory = () => {
    synthRef.current.cancel()
    abortRef.current = true
    setConversationHistory([])
    setTranscript('')
    setResponse('')
    setVoiceState(STATES.IDLE)
  }

  // Expose controls to parent
  useImperativeHandle(ref, () => ({
    triggerVoice: handleButtonPress,
    triggerMessage: (text) => {
      synthRef.current.cancel()
      abortRef.current = true
      setTranscript(text)
      setResponse('')
      setTimeout(() => {
        abortRef.current = false
        sendToHelper(text)
      }, 80)
    },
  }))

  // ── Compact render (elder-first: big voice + chat log) ───────────────────
  if (compact) {
    const isVoiceBusy = voiceState === STATES.THINKING || voiceState === STATES.SPEAKING || voiceState === STATES.LISTENING
    const isTextDisabled = isVoiceBusy

    const handleTextSend = () => {
      const text = textInput.trim()
      if (!text || isTextDisabled) return
      setTextInput('')
      sendToHelper(text, false) // fromVoice = false
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleTextSend()
      }
    }

    // Voice button config per state
    const voiceCfg = {
      idle:      { bg: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800', icon: '🎙️', label: 'Tap to Speak',      pulse: false },
      listening: { bg: 'bg-red-500',                                             icon: '⏹',  label: 'Tap to Stop',       pulse: true  },
      thinking:  { bg: 'bg-amber-400 cursor-not-allowed',                        icon: '✨',  label: 'Sarah is thinking…', pulse: false },
      speaking:  { bg: 'bg-emerald-500',                                         icon: '🔊',  label: 'Sarah is speaking…', pulse: false },
      error:     { bg: 'bg-red-500 hover:bg-red-600',                            icon: '🔄',  label: 'Try again',          pulse: false },
    }
    const vcfg = voiceCfg[voiceState] || voiceCfg.idle

    return (
      <div className="flex flex-col">

        {/* ── Chat log — top (standard chat pattern) ── */}
        <div className="overflow-y-auto px-5 py-4 bg-white" style={{ minHeight: 220, maxHeight: 340 }}>
          {/* Sarah greeting */}
          <motion.div
            className="flex justify-start mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-black text-xs mr-2.5 mt-1 shadow-md">
              S
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[78%]">
              <p className="text-base leading-relaxed text-helper-navy">
                Hi! I'm Sarah. Tap the big button below to talk, or type a message.
              </p>
            </div>
          </motion.div>

          {conversationHistory.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {transcript && voiceState === STATES.LISTENING && (
            <ChatBubble role="user" content={transcript} isLive />
          )}
          {voiceState === STATES.THINKING && !response && (
            <ChatBubble role="assistant" content="" isTyping />
          )}
          {response && (
            <ChatBubble
              role="assistant"
              content={response}
              isLive={voiceState === STATES.SPEAKING || voiceState === STATES.THINKING}
            />
          )}
          <div ref={chatEndRef} />
          {conversationHistory.length > 0 && voiceState === STATES.IDLE && (
            <div className="flex justify-center mt-1">
              <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-400 underline">
                Clear conversation
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 pt-4 pb-5">

          {/* Text input row */}
          <div className="flex items-center gap-2 mb-5">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTextDisabled}
              placeholder={isVoiceBusy ? vcfg.label : 'Type a message…'}
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-base text-helper-navy placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 transition-all"
            />
            <motion.button
              onClick={handleTextSend}
              disabled={!textInput.trim() || isTextDisabled}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </div>

          {/* Big voice button — centred, unmissable */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {vcfg.pulse && (
                <motion.div
                  className="absolute rounded-full bg-red-400"
                  style={{ inset: -12 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <motion.button
                onClick={handleButtonPress}
                disabled={voiceState === STATES.THINKING}
                className={`relative w-20 h-20 rounded-full text-white flex flex-col items-center justify-center gap-1 shadow-2xl transition-colors ${vcfg.bg}`}
                whileHover={voiceState === STATES.IDLE || voiceState === STATES.ERROR ? { scale: 1.07 } : {}}
                whileTap={{ scale: 0.92 }}
              >
                <span className="text-3xl leading-none">{vcfg.icon}</span>
              </motion.button>
            </div>
            <motion.p
              key={vcfg.label}
              className="mt-2.5 text-sm font-bold text-helper-navy"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {vcfg.label}
            </motion.p>
          </div>

        </div>

      </div>
    )
  }

  // ── Default render (standalone / mobile) ──────────────────────────────────
  const STATE_LABELS = {
    [STATES.IDLE]: 'Tap to Talk',
    [STATES.LISTENING]: 'Listening…',
    [STATES.THINKING]: 'Helper is thinking…',
    [STATES.SPEAKING]: 'Helper is speaking…',
    [STATES.ERROR]: 'Try again',
  }
  const STATE_COLORS = {
    [STATES.IDLE]: 'bg-helper-blue hover:bg-helper-blue-dark',
    [STATES.LISTENING]: 'bg-helper-red',
    [STATES.THINKING]: 'bg-helper-amber',
    [STATES.SPEAKING]: 'bg-helper-green',
    [STATES.ERROR]: 'bg-helper-red hover:bg-red-700',
  }
  const isActive = voiceState !== STATES.IDLE && voiceState !== STATES.ERROR

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      <button
        onClick={handleButtonPress}
        className={`relative w-52 h-52 rounded-full shadow-2xl text-white font-black flex flex-col items-center justify-center gap-3 transition-all duration-200 select-none cursor-pointer ${STATE_COLORS[voiceState]} ${voiceState === STATES.LISTENING ? 'voice-active' : ''} ${voiceState === STATES.IDLE || voiceState === STATES.ERROR ? 'hover:scale-105 active:scale-95' : ''}`}
      >
        <span className="text-6xl">
          {voiceState === STATES.IDLE && '🎙️'}
          {voiceState === STATES.LISTENING && '🔴'}
          {voiceState === STATES.THINKING && '🤔'}
          {voiceState === STATES.SPEAKING && '🔊'}
          {voiceState === STATES.ERROR && '⚠️'}
        </span>
        <span className="text-elder-sm font-bold text-center leading-tight px-2">
          {STATE_LABELS[voiceState]}
        </span>
        {isActive && <span className="text-sm text-white/80">Tap to stop</span>}
      </button>

      {voiceState === STATES.LISTENING && (
        <div className="flex items-center gap-1 h-10">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="wave-bar w-2 bg-helper-red rounded-full" style={{ animationDelay: `${(i - 1) * 0.1}s` }} />
          ))}
        </div>
      )}
      {transcript && (
        <div className="w-full card border-2 border-helper-blue">
          <p className="text-elder-sm text-helper-gray-text font-medium mb-1">You said:</p>
          <p className="text-elder-base text-helper-navy font-semibold">{transcript}</p>
        </div>
      )}
      {response && (
        <div className="w-full card border-2 border-helper-green">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🛡️</span>
            <p className="text-elder-sm text-helper-gray-text font-medium">Helper says:</p>
          </div>
          <p className="text-elder-base text-helper-navy leading-relaxed">{response}</p>
        </div>
      )}
      {conversationHistory.length > 0 && voiceState === STATES.IDLE && (
        <button onClick={clearHistory} className="text-helper-gray-text text-elder-sm underline hover:text-helper-navy">
          Clear conversation
        </button>
      )}
    </div>
  )
})

export default VoiceConnect
