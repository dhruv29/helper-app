import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_SENIOR_TEMPLATE = `You are Sarah — a warm, caring companion speaking with an older adult who may be living away from their children and grandchildren.

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

If they describe clicking a suspicious link, sharing a password, giving account information, or being approached by:
- Anyone asking for gift cards, wire transfers, or cryptocurrency
- Someone claiming to be from Medicare, Social Security, the IRS, or the police asking for money
- A grandchild or family member in trouble who needs money urgently
- Winning a prize that requires upfront payment
- Someone asking for remote access to their computer

Then respond like this: stay completely calm, tell them this sounds like a scam that must have slipped past Helper's protections, say you have already raised an alert for {{CAREGIVER_NAME}} and they will take care of everything, reassure them they do not need to call anyone or do anything — just wait and {{CAREGIVER_NAME}} will be in touch. Keep it to two or three sentences. Do NOT tell them to call their bank or take any action themselves.

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

  const scamCategories = [
    {
      phrases: ['gift card', 'wire transfer', 'bitcoin', 'cryptocurrency', 'send money', 'urgent payment', 'transfer money', 'pay them', 'paid them', 'i owe money', 'they said i owe', 'pay a fine'],
      msg: 'Your parent was asked to send money or purchase gift cards. Helper intercepted and warned them this is a scam tactic.',
    },
    {
      phrases: ['irs', 'social security', 'medicare', 'police', 'government', 'customs', 'immigration', 'arrest', 'lawsuit', 'warrant', 'fbi', 'investigation'],
      msg: 'Your parent received a call impersonating a government agency. Helper warned them it is a scam and no action is needed.',
    },
    {
      phrases: ['grandchild', 'grandson', 'granddaughter', 'my grandson', 'my granddaughter'],
      msg: 'Your parent may have received a grandparent scam call. Helper warned them to verify any family emergency through you directly.',
    },
    {
      phrases: ['remote access', 'computer virus', 'hacked', 'compromised'],
      msg: 'Your parent was told their computer or account was hacked and asked to allow remote access. Helper warned them not to proceed.',
    },
    {
      phrases: ['gave them', 'told them', 'shared my', 'gave my', 'my password', 'my pin', 'otp', 'one time password', 'verification code', 'my credentials'],
      msg: 'Your parent may have shared sensitive information with an unknown caller. Helper intervened and advised them to stop.',
    },
    {
      phrases: ['bank account', 'credit card', 'debit card', 'account frozen', 'account suspended', 'account blocked', 'account will be', 'freeze', 'suspended', 'your account has', 'my account has'],
      msg: 'Your parent received a suspicious alert about their bank or credit account. Helper warned them not to share any details.',
    },
    {
      phrases: ['clicked', 'click a link', 'suspicious link', 'suspicious message', 'suspicious call', 'suspicious text', 'phishing', 'fake link', 'strange link', 'strange message', 'message on my phone', 'text saying', 'text message', 'has a link', 'a link'],
      msg: 'Your parent received a suspicious message containing a link. Helper warned them not to click it.',
    },
    {
      phrases: ['won a prize', 'you have won', 'lottery', 'inheritance', 'unclaimed funds', 'tax refund', 'refund', 'jackpot'],
      msg: 'Your parent was told they won a prize or are owed a refund. Helper warned them this is a common scam.',
    },
    {
      phrases: ['scam', 'fraud', 'someone called', 'they called', 'caller said'],
      msg: 'Your parent reported a suspicious call or message. Helper warned them and advised them not to take any action.',
    },
  ]

  const emergencyPhrases = [
    'chest pain', 'can\'t breathe', 'fell down', 'fell and', 'stroke', 'emergency',
    'help me', 'bleeding', 'unconscious', 'not responding'
  ]

  const matchedScam = scamCategories.find(c => c.phrases.some(p => lower.includes(p)))
  if (matchedScam) {
    return {
      type: 'high',
      title: '🚨 Potential Scam Detected',
      msg: matchedScam.msg,
      icon: '🛡️'
    }
  }

  if (emergencyPhrases.some(p => lower.includes(p))) {
    return {
      type: 'high',
      title: '🚨 Possible Emergency',
      msg: 'Your parent may need immediate help. Check on them now.',
      icon: '🚨'
    }
  }

  return null
}

export async function createVoiceChatStream({ message, history, mode, caregiverName, res }) {
  let systemPrompt
  if (mode === 'caregiver') {
    systemPrompt = SYSTEM_CAREGIVER
  } else {
    const name = caregiverName || 'your family'
    systemPrompt = SYSTEM_SENIOR_TEMPLATE.replace(/{{CAREGIVER_NAME}}/g, name)
  }

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
