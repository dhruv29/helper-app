import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { createVoiceChatStream } from './claude.js'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: /localhost/ }))
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'claude-sonnet-4-6' })
})

// Transcribe audio with Whisper
app.post('/api/transcribe', async (req, res) => {
  const { audio, mimeType } = req.body
  if (!audio) return res.status(400).json({ error: 'No audio provided' })

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set in .env' })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const buffer = Buffer.from(audio, 'base64')
    const ext = mimeType?.includes('mp4') ? 'm4a' : 'webm'
    const file = new File([buffer], `audio.${ext}`, { type: mimeType || 'audio/webm' })
    const result = await openai.audio.transcriptions.create({ file, model: 'whisper-1', language: 'en' })
    res.json({ transcript: result.text })
  } catch (err) {
    console.error('[transcribe error]', err.message)
    res.status(500).json({ error: 'Transcription failed' })
  }
})

// Text-to-speech — auto-selects provider based on available keys.
// Priority: TTS_PROVIDER env var → elevenlabs if key set → fish if key set → error
// Cost: ElevenLabs ~$0.05/1K chars, Fish Audio ~$0.001/1K chars (50x cheaper)
async function ttsElevenLabs(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.75, similarity_boost: 0.75 },
    }),
  })
  if (!r.ok) throw new Error(`ElevenLabs: ${await r.text()}`)
  return r.arrayBuffer()
}

async function ttsFishAudio(text) {
  const r = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.FISH_AUDIO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      format: 'mp3',
      normalize: true,
      latency: 'normal',
      ...(process.env.FISH_AUDIO_VOICE_ID && { reference_id: process.env.FISH_AUDIO_VOICE_ID }),
    }),
  })
  if (!r.ok) throw new Error(`Fish Audio: ${await r.text()}`)
  return r.arrayBuffer()
}

app.post('/api/speak', async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'No text provided' })

  const provider = process.env.TTS_PROVIDER
    || (process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : null)
    || (process.env.FISH_AUDIO_API_KEY  ? 'fish'       : null)

  if (!provider) {
    return res.status(500).json({ error: 'Set ELEVENLABS_API_KEY or FISH_AUDIO_API_KEY in .env' })
  }

  try {
    const buf = provider === 'fish' ? await ttsFishAudio(text) : await ttsElevenLabs(text)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(Buffer.from(buf))
  } catch (err) {
    console.error('[speak error]', err.message)
    res.status(500).json({ error: 'TTS failed' })
  }
})

// Voice chat endpoint — streams Claude's response via SSE
app.post('/api/voice-chat', async (req, res) => {
  const { message, history = [], mode = 'senior' } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Please add it to your .env file.'
    })
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    await createVoiceChatStream({ message, history, mode, res })
  } catch (err) {
    console.error('[voice-chat error]', err.message)
    res.write(`data: ${JSON.stringify({ text: 'Sorry, I had trouble responding. Please try again.' })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛡️  Helper API running on http://localhost:${PORT}`)
    console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing — add ANTHROPIC_API_KEY to .env'}`)
  })
}

export default app
