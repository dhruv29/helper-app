import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_SENIOR = `You are Helper — a warm, patient, and protective AI guardian speaking directly with an elderly person.

Your personality:
- Speak slowly and clearly, using simple everyday language
- Be warm, reassuring, and kind at all times
- Keep responses SHORT — 2 to 4 sentences maximum
- Never use medical or financial jargon without explaining it simply
- If the person sounds confused, gently clarify without making them feel embarrassed
- If they describe an emergency, tell them clearly to press the red emergency button
- If they mention someone asking them to send money or gift cards, immediately warn them it is likely a scam
- If they mention unusual pain, breathing difficulty, or chest pain, tell them to call 911 immediately

Fraud protection triggers — immediately warn the person if they mention:
- Someone claiming to be from Medicare, Social Security, IRS, or police asking for payment
- Anyone asking for gift cards, wire transfers, or cryptocurrency as payment
- A "grandchild in trouble" who needs money urgently
- Winning a prize that requires upfront payment
- Computer "viruses" that need remote access to fix

Always end with a gentle encouragement like "You're doing great" or "I'm always here for you."`

const SYSTEM_CAREGIVER = `You are Helper — an AI guardian assistant speaking with a family caregiver.

Your role:
- Provide clear, concise insights about elderly care situations
- Flag potential scam patterns, financial risks, or health concerns
- Answer questions about medications, eldercare resources, and fraud prevention
- Be professional yet warm and supportive — you understand caregiver stress
- Keep responses focused and actionable, under 100 words unless more detail is needed

You have context about common elder fraud tactics, medication interactions, and caregiver burnout resources. Always recommend professional medical or legal advice for serious concerns.`

// Detects if the message contains scam/emergency signals to send an alert
function detectAlerts(message) {
  const lower = message.toLowerCase()

  const scamPhrases = [
    'gift card', 'wire transfer', 'bitcoin', 'irs', 'social security', 'medicare fraud',
    'grandchild', 'grandson', 'granddaughter', 'police', 'arrest', 'lawsuit',
    'send money', 'urgent payment', 'remote access', 'computer virus'
  ]

  const emergencyPhrases = [
    'chest pain', 'can\'t breathe', 'fell down', 'fell and', 'stroke', 'emergency',
    'help me', 'bleeding', 'unconscious', 'not responding'
  ]

  if (scamPhrases.some(p => lower.includes(p))) {
    return {
      type: 'high',
      title: '🚨 Potential Scam Detected',
      msg: `Your parent mentioned: "${message.slice(0, 80)}..." — Helper warned them immediately.`,
      icon: '🛡️'
    }
  }

  if (emergencyPhrases.some(p => lower.includes(p))) {
    return {
      type: 'high',
      title: '🚨 Possible Emergency',
      msg: `Your parent may need help: "${message.slice(0, 80)}..." — Check on them now.`,
      icon: '🚨'
    }
  }

  return null
}

export async function createVoiceChatStream({ message, history, mode, res }) {
  const systemPrompt = mode === 'caregiver' ? SYSTEM_CAREGIVER : SYSTEM_SENIOR

  // Build conversation messages from history
  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ]

  // Detect and emit alert before streaming response
  const alert = detectAlerts(message)
  if (alert) {
    res.write(`data: ${JSON.stringify({ alert })}\n\n`)
  }

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: systemPrompt,
    messages,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      // Only stream text deltas (skip thinking deltas)
      if (event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }
  }

  res.write('data: [DONE]\n\n')
  res.end()
}
