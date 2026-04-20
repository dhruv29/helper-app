import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.warn('[db] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — DB calls will fail')
}

export const db = url && key ? createClient(url, key) : null

// ── Seniors ────────────────────────────────────────────────────────────────────

export async function getSenior(id) {
  const { data, error } = await db.from('seniors').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

// ── Alerts ─────────────────────────────────────────────────────────────────────

export async function getAlerts(seniorId, { limit = 50, resolved = false } = {}) {
  const { data, error } = await db
    .from('alerts')
    .select('*')
    .eq('senior_id', seniorId)
    .eq('resolved', resolved)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createAlert(alert) {
  const { data, error } = await db.from('alerts').insert(alert).select().single()
  if (error) throw error
  return data
}

export async function resolveAlert(id) {
  const { data, error } = await db
    .from('alerts')
    .update({ resolved: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Conversations & Messages ────────────────────────────────────────────────────

export async function startConversation(seniorId) {
  const { data, error } = await db
    .from('conversations')
    .insert({ senior_id: seniorId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endConversation(id, { mood, summary } = {}) {
  const { data, error } = await db
    .from('conversations')
    .update({ ended_at: new Date().toISOString(), mood, summary })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function saveMessage(conversationId, role, content) {
  const { data, error } = await db
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMessages(conversationId) {
  const { data, error } = await db
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ── Medications ────────────────────────────────────────────────────────────────

export async function getMedications(seniorId) {
  const { data, error } = await db
    .from('medications')
    .select('*')
    .eq('senior_id', seniorId)
    .order('name')
  if (error) throw error
  return data
}

export async function markMedicationTaken(id, taken = true) {
  const { data, error } = await db
    .from('medications')
    .update({ taken_today: taken, last_taken: taken ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Wellness ───────────────────────────────────────────────────────────────────

export async function getTodayWellness(seniorId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('wellness_scores')
    .select('*')
    .eq('senior_id', seniorId)
    .eq('date', today)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertWellness(seniorId, scores) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('wellness_scores')
    .upsert({ senior_id: seniorId, date: today, ...scores })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Handoffs ───────────────────────────────────────────────────────────────────

export async function getLatestHandoff(seniorId) {
  const { data, error } = await db
    .from('handoffs')
    .select('*')
    .eq('senior_id', seniorId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertHandoff(seniorId, { headline, body, moodEmoji }) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('handoffs')
    .upsert({
      senior_id: seniorId,
      date: today,
      headline,
      body,
      mood_emoji: moodEmoji,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}
