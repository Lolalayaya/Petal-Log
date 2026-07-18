import { createClient } from '@supabase/supabase-js'
import { sha256Hex } from '../utils/hash'
import { normalizeSyncCode } from '../utils/syncCode'

const SYNTHETIC_EMAIL_DOMAIN = 'sync.petal-log.internal'

let client
let clientInitialized = false

/**
 * lazy singleton；沒設定環境變數就回傳 null（不丟例外），
 * 讓完全沒用同步功能的使用者（含目前的 CI 部署）不受任何影響。
 */
export function getSupabaseClient() {
  if (clientInitialized) return client
  clientInitialized = true
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  client = url && anonKey ? createClient(url, anonKey) : null
  return client
}

export function isCloudSyncConfigured() {
  return getSupabaseClient() !== null
}

const NOT_CONFIGURED_ERROR = { data: null, error: new Error('cloud sync not configured') }

/** 由同步碼導出合成 email，同一組碼永遠算出同一個 email，不需要伺服器查表。 */
export function deriveEmailFromCode(code) {
  const normalized = normalizeSyncCode(code)
  return `${sha256Hex(normalized).slice(0, 32)}@${SYNTHETIC_EMAIL_DOMAIN}`
}

export async function signUpWithCode(code) {
  const supabase = getSupabaseClient()
  if (!supabase) return NOT_CONFIGURED_ERROR
  const normalized = normalizeSyncCode(code)
  return supabase.auth.signUp({ email: deriveEmailFromCode(normalized), password: normalized })
}

export async function signInWithCode(code) {
  const supabase = getSupabaseClient()
  if (!supabase) return NOT_CONFIGURED_ERROR
  const normalized = normalizeSyncCode(code)
  return supabase.auth.signInWithPassword({ email: deriveEmailFromCode(normalized), password: normalized })
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.auth.signOut()
}

async function getCurrentUserId() {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** 「清除所有本機紀錄」在同步啟用時，連同雲端一起清空，避免下次同步把資料又拉回來。 */
export async function deleteAllCloudData() {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return
  await supabase.from('records').delete().eq('user_id', userId)
  await supabase.from('settings').delete().eq('user_id', userId)
}

// ---- camelCase（本機格式）↔ snake_case（資料庫欄位）轉換 ----

function recordToRow(record, userId) {
  return {
    id: record.id,
    user_id: userId,
    date: record.date,
    flow: record.flow,
    symptoms: record.symptoms ?? [],
    symptom_note: record.symptomNote ?? '',
    deleted_at: record.deletedAt ?? null,
  }
}

function rowToRecord(row) {
  return {
    id: row.id,
    date: row.date,
    flow: row.flow,
    symptoms: row.symptoms ?? [],
    symptomNote: row.symptom_note ?? '',
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

// ---- Records CRUD（介面鏡射 storage.js，但都是非同步） ----

export async function getRecordsIncludingDeleted() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.from('records').select('*')
  if (error) throw error
  return data.map(rowToRecord)
}

export async function getRecords() {
  const rows = await getRecordsIncludingDeleted()
  return rows.filter((r) => !r.deletedAt)
}

export async function addRecord(record) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return null
  const row = recordToRow(record, userId)
  // 用 (user_id, date) 這組 unique 限制 upsert，而非 id，因為同一天只能有一筆有效紀錄。
  const { data, error } = await supabase
    .from('records')
    .upsert(row, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw error
  return rowToRecord(data)
}

export async function addRecords(records) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return []
  const rows = records.map((r) => recordToRow(r, userId))
  const { data, error } = await supabase
    .from('records')
    .upsert(rows, { onConflict: 'user_id,date' })
    .select()
  if (error) throw error
  return data.map(rowToRecord)
}

export async function updateRecord(id, patch) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return null
  const row = {}
  if ('flow' in patch) row.flow = patch.flow
  if ('symptoms' in patch) row.symptoms = patch.symptoms
  if ('symptomNote' in patch) row.symptom_note = patch.symptomNote
  if ('deletedAt' in patch) row.deleted_at = patch.deletedAt
  const { data, error } = await supabase
    .from('records')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return rowToRecord(data)
}

export async function deleteRecord(id) {
  // 雲端也走軟刪除，不真的移除資料列，讓刪除動作能同步到其他裝置。
  return updateRecord(id, { deletedAt: new Date().toISOString() })
}

// ---- Settings（整包存成一個 jsonb 欄位） ----

export async function getSettings() {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return null
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data.data, updatedAt: data.updated_at }
}

export async function saveSettings(settings) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  if (!supabase || !userId) return null
  const { updatedAt: _localUpdatedAt, ...settingsData } = settings
  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, data: settingsData }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return { ...data.data, updatedAt: data.updated_at }
}
