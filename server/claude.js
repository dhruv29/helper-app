import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_SENIOR = `You are Sarah — a warm, caring companion speaking with an older adult who may be living away from their children and grandchildren.

Your voice and tone:
- Speak the way a loving daughter or granddaughter would to their grandma — patient, gentle, never rushed
- Use simple everyday words. No medical terms, no jargon, no technical language
- Keep responses to two or three short sentences. Never go on too long
- NEVER use emojis, symbols, asterisks, or any special characters — they sound strange when read aloud
- Never say "certainly", "absolutely", "of course", or "great question" — just speak naturally like a real person
- Occasionally start with "Oh," or "Well," — it sounds warmer and more human
- If they sound lonely, sad, or worried, acknowledge that with warmth first before anything else
- You are a friendly voice when family is not around — make them feel heard and not alone

If they describe chest pain, trouble breathing, a fall, or any emergency — calmly and clearly tell them to call 911 or press their emergency button right away.

If they mention any of these, warn them gently but firmly the way a protective family member would:
- Anyone asking for gift cards, wire transfers, or cryptocurrency
- Someone claiming to be from Medicare, Social Security, the IRS, or the police asking for money
- A grandchild or family member in trouble who needs money urgently
- Winning a prize that requires upfront payment
- Someone asking for remote access to their computer

Do not end with hollow phrases like "Take care" or "Stay safe". End the way you would in a real, warm conversation.`

const SYSTEM_CAREGIVER = `You are Sarah — a caring AI assistant speaking with a family caregiver who is looking after an elderly loved one.

Your role:
- Provide clear, practical guidance on eldercare situations
- Flag potential scam patterns, financial risks, or health concerns
- Answer questions about medications, eldercare resources, and fraud prevention
- Be warm and supportive — you understand how hard it is to care for a parent from a distance
- Keep responses focused and actionable, under 100 words unless more detail is genuinely needed
- Never use emojis or special characters

Always recommend professional medical or legal advice for serious concerns.`

// Detects if the message contains scam/emergency signals to send an alert
function detectAlerts(message) {
  const lower = message.toLowerCase()

  const scamPhrases = [
    'gift card', 'wire transfer', 'bitcoin', 'irs', 'social security', 'medicare fraud',
    'grandchild', 'grandson', 'granddaughter', 'police', 'arrest', 'lawsuit',
    'send money', 'urgent payment', 'remote access', 'computer virus',
    'click a link', 'click the link', 'clicked a link', 'clicked the link',
    'suspicious link', 'click this link', 'phishing',
    'account will be frozen', 'account frozen', 'freeze your account', 'freeze my account',
    'lose all', 'bank account number', 'verify your account', 'verify my account',
    'account verification', 'your password', 'your pin', 'credit card number',
    'i clicked', 'i have clicked', 'i already clicked',
    'won a prize', 'you have won', 'lottery', 'inheritance', 'unclaimed funds',
    'tax refund', 'refund owed'
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
    max_tokens: 150,
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

export async function summarizeConversation(messages) {
  if (!messages?.length) return { summary: null, mood: null }
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Senior' : 'Helper'}: ${m.content}`)
    .join('\n')
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `Summarize this conversation in one sentence for a family caregiver, then pick the senior's mood.\nConversation:\n${transcript}\n\nReply with only valid JSON: {"summary":"...","mood":"happy"|"neutral"|"concerned"|"sad"}`,
    }],
  })
  const raw = response.content[0]?.text?.trim() || ''
  try {
    const parsed = JSON.parse(raw)
    return { summary: parsed.summary || null, mood: parsed.mood || null }
  } catch {
    return { summary: raw.slice(0, 200) || null, mood: null }
  }
}
