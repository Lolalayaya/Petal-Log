const RECORDS_KEY = 'petal-log:records'
const SETTINGS_KEY = 'petal-log:settings'

const DEFAULT_SETTINGS = {
  neutralLanguage: true,
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
  phaseColors: {
    menstrual: '#b5645c',
    follicular: '#c98a2b',
    ovulation: '#4f9d8c',
    luteal: '#6f8fb0',
  },
  customSymptoms: [],
  symptomColors: {},
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

export function getRecords() {
  return read(RECORDS_KEY, [])
}

export function addRecord(record) {
  const records = getRecords().filter((r) => r.date !== record.date)
  const next = [...records, record].sort((a, b) => a.date.localeCompare(b.date))
  write(RECORDS_KEY, next)
  return next
}

export function addRecords(newRecords) {
  const newDates = new Set(newRecords.map((r) => r.date))
  const records = getRecords().filter((r) => !newDates.has(r.date))
  const next = [...records, ...newRecords].sort((a, b) => a.date.localeCompare(b.date))
  write(RECORDS_KEY, next)
  return next
}

export function updateRecord(id, patch) {
  const next = getRecords().map((r) => (r.id === id ? { ...r, ...patch } : r))
  write(RECORDS_KEY, next)
  return next
}

export function deleteRecord(id) {
  const next = getRecords().filter((r) => r.id !== id)
  write(RECORDS_KEY, next)
  return next
}

export function getSettings() {
  // 與預設值合併，避免舊版本存下的 settings 缺少新增欄位而變成 undefined。
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings)
  return settings
}

export function clearAllData() {
  localStorage.removeItem(RECORDS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
