const RECORDS_KEY = 'petal-log:records'
const SETTINGS_KEY = 'petal-log:settings'

const DEFAULT_SETTINGS = {
  avgPeriodLength: 5,
  avgCycleLength: 28,
  autoFillSubsequentDays: true,
  onboardingCompleted: false,
  showOvulationPrediction: true,
  showMenstrualPhase: false,
  showFollicularPhase: false,
  showOvulationPhase: false,
  showLutealPhase: false,
  showSymptomTracking: false,
  showAnomalyAlerts: true,
  phaseColors: {
    menstrual: '#b5645c',
    follicular: '#c98a2b',
    ovulation: '#4f9d8c',
    luteal: '#6f8fb0',
  },
  customSymptoms: [],
  symptomColors: {},
  hiddenSymptoms: [],
  // 雲端同步預留欄位：settings 整包比較新舊時使用（見雲端同步規劃）。
  updatedAt: null,
}

function read(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function nowIso() {
  return new Date().toISOString()
}

// 原始紀錄陣列，包含軟刪除（deletedAt 有值）的 tombstone 列。
// 只給雲端同步層使用，一般 UI 一律透過 getRecords() 取得已過濾的清單。
function readRaw() {
  return read(RECORDS_KEY, [])
}

function writeRaw(records) {
  write(RECORDS_KEY, records)
}

export function getRecords() {
  return readRaw().filter((r) => !r.deletedAt)
}

export function getRecordsIncludingDeleted() {
  return readRaw()
}

export function addRecord(record) {
  // 對 raw（含 tombstone）陣列去重，避免同一天先被軟刪除、又重新記錄時，
  // 留下一筆 tombstone 加一筆新資料兩筆同日期的紀錄。
  const raw = readRaw().filter((r) => r.date !== record.date)
  const stamped = { ...record, deletedAt: null, updatedAt: nowIso() }
  const next = [...raw, stamped].sort((a, b) => a.date.localeCompare(b.date))
  writeRaw(next)
  return next.filter((r) => !r.deletedAt)
}

export function addRecords(newRecords) {
  const newDates = new Set(newRecords.map((r) => r.date))
  const raw = readRaw().filter((r) => !newDates.has(r.date))
  const stamped = newRecords.map((r) => ({ ...r, deletedAt: null, updatedAt: nowIso() }))
  const next = [...raw, ...stamped].sort((a, b) => a.date.localeCompare(b.date))
  writeRaw(next)
  return next.filter((r) => !r.deletedAt)
}

export function updateRecord(id, patch) {
  const next = readRaw().map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r))
  writeRaw(next)
  return next.filter((r) => !r.deletedAt)
}

export function deleteRecord(id) {
  // 軟刪除：保留原始資料列並標記 deletedAt，讓雲端同步能把「刪除」這個動作
  // 同步到其他裝置，而不是讓資料悄悄消失、其他裝置卻看不出這是刻意刪除的。
  const timestamp = nowIso()
  const next = readRaw().map((r) => (r.id === id ? { ...r, deletedAt: timestamp, updatedAt: timestamp } : r))
  writeRaw(next)
  return next.filter((r) => !r.deletedAt)
}

export function getSettings() {
  // 與預設值合併，避免舊版本存下的 settings 缺少新增欄位而變成 undefined。
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  const next = { ...settings, updatedAt: nowIso() }
  write(SETTINGS_KEY, next)
  return next
}

export function clearAllData() {
  localStorage.removeItem(RECORDS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}

// ---- 以下只給雲端同步層使用：寫入時保留呼叫端傳入的 updatedAt/deletedAt 原始值，
// 不像 addRecord/updateRecord 那樣自動蓋上「現在」的時間戳。
// 因為同步拉取的資料代表「雲端在某個時間點的狀態」，不是「現在發生的本機編輯」，
// 蓋上本機現在時間會讓下一輪同步誤判成「本機比較新」。

export function upsertRecordsRaw(records) {
  const incomingDates = new Set(records.map((r) => r.date))
  const raw = readRaw().filter((r) => !incomingDates.has(r.date))
  const next = [...raw, ...records].sort((a, b) => a.date.localeCompare(b.date))
  writeRaw(next)
  return next.filter((r) => !r.deletedAt)
}

export function saveSettingsRaw(settings) {
  write(SETTINGS_KEY, settings)
  return settings
}
