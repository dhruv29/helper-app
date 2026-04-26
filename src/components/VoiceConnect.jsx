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


const VoiceConnect = forwardRef(function VoiceConnect(
  { onAlert, mode = 'senior', onStateChange, onResponse, onTranscript, onHistory, compact = false, headless = false },
  ref
) {
  const [voiceState, setVoiceState] = useState(STATES.IDLE)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)
  const audioUnlockedRef = useRef(false)
  const abortRef = useRef(false)
  const silenceTimerRef = useRef(null)
  const audioContextRef = useRef(null)

  useEffect(() => { onStateChange?.(voiceState) }, [voiceState, onStateChange])
  useEffect(() => { onResponse?.(response) }, [response, onResponse])
  useEffect(() => { onTranscript?.(transcript) }, [transcript, onTranscript])

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }

  const speakWithBrowser = (text, resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { resolve(); return }
    synth.cancel()
    const clean = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').replace(/\s+/g, ' ').trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 0.85
    utterance.pitch = 1.05
    utterance.onend = resolve
    utterance.onerror = resolve
    synth.speak(utterance)
  }

  const speak = useCallback(async (text) => {
    stopAudio()
    return new Promise((resolve) => {
      fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then(res => {
          if (!res.ok) {
            console.error('[speak] server error:', res.status)
            return null
          }
          return res.blob()
        })
        .then(blob => {
          if (!blob) { speakWithBrowser(text, resolve); return }
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve() }
          audio.onerror = (e) => {
            console.error('[speak] audio decode error:', e)
            URL.revokeObjectURL(url)
            audioRef.current = null
            speakWithBrowser(text, resolve)
          }
          audio.play().catch(e => {
            console.error('[speak] play() rejected:', e)
            speakWithBrowser(text, resolve)
          })
        })
        .catch(e => {
          console.error('[speak] fetch error:', e)
          speakWithBrowser(text, resolve)
        })
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
    onHistory?.(newHistory)

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
      onHistory?.(finalHistory)
      setResponse('') // clear live bubble — message is now in history

      if (fromVoice && fullResponse && !abortRef.current) {
        await speak(fullResponse)
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

  const transcribeAudio = async (blob, mimeType) => {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType }),
      })
      if (!res.ok) throw new Error('Transcription failed')
      const { transcript } = await res.json()
      if (!transcript?.trim()) { setVoiceState(STATES.IDLE); return }
      setTranscript(transcript)
      await sendToHelper(transcript, true)
    } catch (err) {
      console.error(err)
      setVoiceState(STATES.ERROR)
      setResponse('Could not transcribe audio. Please try again.')
    }
  }

  const handleButtonPress = async () => {
    // Unlock audio on first tap — iOS Safari blocks play() after async gaps
    if (!audioUnlockedRef.current) {
      audioUnlockedRef.current = true
      const a = new Audio()
      a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      a.play().catch(() => {})
    }

    stopAudio()

    if (voiceState === STATES.LISTENING) {
      mediaRecorderRef.current?.stop()
      return
    }
    if (voiceState === STATES.THINKING || voiceState === STATES.SPEAKING) {
      abortRef.current = true
      stopAudio()
      setVoiceState(STATES.IDLE)
      return
    }

    setTranscript('')
    setResponse('')
    setVoiceState(STATES.LISTENING)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
        audioContextRef.current?.close().catch(() => {})
        audioContextRef.current = null
        setVoiceState(STATES.THINKING)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        if (blob.size < 500) { setVoiceState(STATES.IDLE); return }
        await transcribeAudio(blob, mimeType)
      }

      recorder.start()
      mediaRecorderRef.current = recorder

      // Auto-stop on 1.5s of silence using Web Audio analyser
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const checkSilence = () => {
        if (mediaRecorderRef.current?.state !== 'recording') return
        analyser.getByteFrequencyData(data)
        const volume = data.reduce((s, v) => s + v, 0) / data.length
        if (volume < 8) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              mediaRecorderRef.current?.stop()
              audioCtx.close()
            }, 1500)
          }
        } else {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        requestAnimationFrame(checkSilence)
      }
      requestAnimationFrame(checkSilence)
    } catch {
      setVoiceState(STATES.ERROR)
      setResponse('Could not access microphone. Please allow microphone permission and try again.')
    }
  }

  const clearHistory = () => {
    mediaRecorderRef.current?.stop()
    stopAudio()
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
      stopAudio()
      abortRef.current = true
      setTranscript(text)
      setResponse('')
      setTimeout(() => {
        abortRef.current = false
        sendToHelper(text)
      }, 80)
    },
  }))

  if (headless) return null

  // ── Compact render (voice-first, no chat clutter) ────────────────────────
  if (compact) {
    const isVoiceBusy = voiceState === STATES.THINKING || voiceState === STATES.SPEAKING || voiceState === STATES.LISTENING

    const voiceCfg = {
      idle:      { bg: '#4F46E5', shadow: 'rgba(79,70,229,0.35)',  icon: '🎙️', status: null,                  pulse: false },
      listening: { bg: '#DC2626', shadow: 'rgba(220,38,38,0.4)',   icon: '🎙️', status: 'Listening…',          pulse: true  },
      thinking:  { bg: '#D97706', shadow: 'rgba(217,119,6,0.35)',  icon: '✨',  status: 'Sarah is thinking…',  pulse: false },
      speaking:  { bg: '#059669', shadow: 'rgba(5,150,105,0.35)',  icon: '🔊',  status: 'Sarah is speaking…',  pulse: false },
      error:     { bg: '#DC2626', shadow: 'rgba(220,38,38,0.3)',   icon: '🔄',  status: 'Something went wrong', pulse: false },
    }
    const vcfg = voiceCfg[voiceState] || voiceCfg.idle

    // Last thing Sarah said — shown as a single reply card
    const lastAssistant = [...conversationHistory].reverse().find(m => m.role === 'assistant')
    const lastUser      = [...conversationHistory].reverse().find(m => m.role === 'user')
    const displayResponse = response || lastAssistant?.content || null
    const displayTranscript = (transcript && voiceState === STATES.LISTENING) ? transcript : lastUser?.content || null

    return (
      <div className="flex flex-col items-center px-4 sm:px-6 py-5 sm:py-8 bg-white">

        {/* Instruction */}
        <motion.h2
          className="text-2xl font-black text-helper-navy text-center mb-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          {voiceState === STATES.IDLE || voiceState === STATES.ERROR
            ? 'Talk to Sarah'
            : vcfg.status}
        </motion.h2>
        <p className="text-sm text-helper-gray-text text-center mb-6">
          {voiceState === STATES.IDLE ? 'Press the button and speak clearly' : '\u00A0'}
        </p>

        {/* What you said */}
        {displayTranscript && (
          <motion.div
            className="w-full mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wide">You said</p>
            <p className="text-base text-helper-navy leading-relaxed">{displayTranscript}</p>
          </motion.div>
        )}

        {/* Sarah's reply */}
        {(displayResponse || (voiceState === STATES.THINKING && !response)) && (
          <motion.div
            className="w-full mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Sarah</p>
            {voiceState === STATES.THINKING && !response ? (
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ opacity: [0.3,1,0.3], scale: [0.8,1.2,0.8] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-base text-helper-navy leading-relaxed">{displayResponse}</p>
            )}
          </motion.div>
        )}

        {/* Big round button */}
        <div className="relative mb-4">
          {vcfg.pulse && (
            <motion.div
              className="absolute rounded-full"
              style={{ inset: -16, backgroundColor: vcfg.bg }}
              animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <motion.button
            onClick={handleButtonPress}
            disabled={voiceState === STATES.THINKING}
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: vcfg.bg,
              boxShadow: `0 12px 40px ${vcfg.shadow}`,
            }}
            animate={{ backgroundColor: vcfg.bg }}
            transition={{ duration: 0.4 }}
            whileHover={!isVoiceBusy || voiceState === STATES.ERROR ? { scale: 1.06 } : {}}
            whileTap={{ scale: 0.93 }}
          >
            <span className="text-5xl leading-none">{vcfg.icon}</span>
          </motion.button>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={voiceState === STATES.LISTENING ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <p className="text-sm font-semibold text-helper-gray-text">
            {voiceState === STATES.IDLE ? 'Ready to listen' : vcfg.status}
          </p>
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
