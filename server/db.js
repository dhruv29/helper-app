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

export async function upsertSenior({ id, name, age, city, healthNotes, interests }) {
  const row = {
    name,
    age: age ? parseInt(age) : null,
    city: city || null,
    health_notes: healthNotes || null,
    interests: interests?.length ? interests : null,
  }
  if (id) row.id = id
  const { data, error } = await db
    .from('seniors')
    .upsert(row, { onConflict: 'id' })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function upsertCaregiver({ id, name, relationship, seniorId, emergencyName, emergencyPhone, clerkUserId }) {
  const row = {
    name,
    relationship: relationship || null,
    senior_id: seniorId,
    emergency_name: emergencyName || null,
    emergency_phone: emergencyPhone || null,
  }
  if (id) row.id = id
  if (clerkUserId) row.clerk_user_id = clerkUserId

  // Prefer clerk_user_id as conflict key — guarantees one record per Clerk account
  const conflictCol = clerkUserId ? 'clerk_user_id' : 'id'
  const { data, error } = await db
    .from('caregivers')
    .upsert(row, { onConflict: conflictCol })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function getCaregiverByClerkId(clerkUserId) {
  const { data } = await db
    .from('caregivers')
    .select('id, senior_id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
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

export async function syncMedications(seniorId, medications) {
  // Delete all existing and re-insert so additions/removals are handled cleanly
  await db.from('medications').delete().eq('senior_id', seniorId)
  if (!medications.length) return
  const rows = medications
    .filter(m => m.name?.trim())
    .map(m => ({ senior_id: seniorId, name: m.name.trim(), dose: m.dose || null, schedule: m.schedule || 'Morning', taken_today: false }))
  if (rows.length) {
    const { error } = await db.from('medications').insert(rows)
    if (error) throw error
  }
}

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
