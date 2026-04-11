import express from 'express'
import cors from 'cors'
import { createVoiceChatStream } from './claude.js'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'claude-opus-4-6' })
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


app.listen(PORT, () => {
  console.log(`\n🛡️  Helper API running on http://localhost:${PORT}`)
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing — add ANTHROPIC_API_KEY to .env'}`)
})
