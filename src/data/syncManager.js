import { generateSyncCode, validateSyncCodeChecksum } from '../utils/syncCode'
import {
  isCloudSyncConfigured,
  signUpWithCode,
  signInWithCode,
  signOut as cloudSignOut,
  getCurrentSession,
  bindRecoveryEmail as cloudBindRecoveryEmail,
  getRecordsIncludingDeleted as cloudGetRecordsIncludingDeleted,
  addRecords as cloudAddRecords,
  getSettings as cloudGetSettings,
  saveSettings as cloudSaveSettings,
  deleteAllCloudData,
} from './cloudAdapter'
import {
  getRecords as localGetRecords,
  getRecordsIncludingDeleted as localGetRecordsIncludingDeleted,
  upsertRecordsRaw,
  getSettings as localGetSettings,
  saveSettingsRaw,
  clearAllData,
} from './storage'

const SYNC_CODE_KEY = 'petal-log:sync-code'

const listeners = new Set()

/** 訂閱「背景同步跑完了」，供 useCloudSync 呼叫 refreshFromStorage 更新畫面。 */
export function subscribe(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function notify() {
  listeners.forEach((callback) => callback())
}

function getStoredCode() {
  return localStorage.getItem(SYNC_CODE_KEY)
}

function setStoredCode(code) {
  localStorage.setItem(SYNC_CODE_KEY, code)
}

function clearStoredCode() {
  localStorage.removeItem(SYNC_CODE_KEY)
}

export function getSyncStatus() {
  return {
    configured: isCloudSyncConfigured(),
    enabled: !!getStoredCode(),
  }
}

function indexByDate(records) {
  const map = new Map()
  records.forEach((r) => map.set(r.date, r))
  return map
}

let pendingJoinCode = null

/**
 * 建立新同步碼並啟用同步，回傳碼供 UI 顯示。
 * @param {string} [themeName] 使用者選擇的主題；省略時隨機挑一個主題。
 */
export async function enableSyncNew(themeName) {
  if (!isCloudSyncConfigured()) return { error: { type: 'not-configured' } }

  const code = generateSyncCode(themeName)
  const { error } = await signUpWithCode(code)
  if (error) return { error: { type: 'sign-up-failed', message: error.message } }

  setStoredCode(code)
  await runSync()
  return { code }
}

/**
 * 輸入既有同步碼加入。若本機已有紀錄，不會靜默覆蓋或合併，
 * 而是回傳 needsDecision，讓 UI 問使用者要合併還是改用雲端覆蓋，交給 resolveJoin 完成。
 */
export async function enableSyncJoin(rawCode) {
  if (!isCloudSyncConfigured()) return { error: { type: 'not-configured' } }

  const { valid, reason, normalized } = validateSyncCodeChecksum(rawCode)
  if (!valid) return { error: { type: reason } }

  const { error } = await signInWithCode(normalized)
  if (error) return { error: { type: 'sign-in-failed', message: error.message } }

  if (localGetRecords().length === 0) {
    setStoredCode(normalized)
    await runSync()
    return { joined: true }
  }

  pendingJoinCode = normalized
  return { needsDecision: true }
}

/** @param {'merge' | 'overwrite-with-cloud'} strategy */
export async function resolveJoin(strategy) {
  if (!pendingJoinCode) return { error: { type: 'no-pending-join' } }
  const code = pendingJoinCode
  pendingJoinCode = null

  if (strategy === 'overwrite-with-cloud') {
    clearAllData()
  }

  setStoredCode(code)
  await runSync()
  return { joined: true }
}

export function revealCode() {
  return getStoredCode()
}

export async function bindRecoveryEmail(email) {
  return cloudBindRecoveryEmail(email)
}

/** 結束同步，僅影響本機（雲端資料與帳號都還在，換裝置輸入同一組碼仍可加入）。 */
export async function disableSync() {
  await cloudSignOut()
  clearStoredCode()
  notify()
}

/**
 * 「清除所有本機紀錄」在同步啟用時的對應版本：連同雲端資料一起清空並結束同步，
 * 否則單純清本機、下次同步又會被雲端資料覆蓋回來，等於沒清到。
 */
export async function resetEverything() {
  if (getStoredCode()) {
    try {
      await deleteAllCloudData()
    } catch {
      // 雲端刪除失敗也要繼續清本機，不能因為網路問題卡住使用者的清除操作
    }
    await cloudSignOut()
    clearStoredCode()
  }
  clearAllData()
  notify()
}

let inFlightSync = null

/** 全量拉取比對，逐筆用 updatedAt 決勝，本機永遠先寫入成功，雲端推送是 best-effort。 */
export function runSync() {
  if (inFlightSync) return inFlightSync
  inFlightSync = doRunSync().finally(() => {
    inFlightSync = null
  })
  return inFlightSync
}

async function doRunSync() {
  if (!isCloudSyncConfigured()) return
  const code = getStoredCode()
  if (!code) return

  try {
    let session = await getCurrentSession()
    if (!session) {
      const { error } = await signInWithCode(code)
      if (error) return // 網路或帳號問題，下次上線/前景再試
      session = await getCurrentSession()
      if (!session) return
    }

    await syncRecords()
    await syncSettings()
    notify()
  } catch {
    // 同步失敗不能影響本機操作，安靜放棄，下次觸發時機再重試
  }
}

async function syncRecords() {
  const localRecords = localGetRecordsIncludingDeleted()
  const cloudRecords = await cloudGetRecordsIncludingDeleted()
  const localByDate = indexByDate(localRecords)
  const cloudByDate = indexByDate(cloudRecords)
  const allDates = new Set([...localByDate.keys(), ...cloudByDate.keys()])

  const toPushToCloud = []
  const toPullToLocal = []

  for (const date of allDates) {
    const local = localByDate.get(date)
    const cloud = cloudByDate.get(date)

    if (local && !cloud) {
      toPushToCloud.push(local)
    } else if (!local && cloud) {
      toPullToLocal.push(cloud)
    } else {
      const localTime = new Date(local.updatedAt).getTime()
      const cloudTime = new Date(cloud.updatedAt).getTime()
      if (localTime > cloudTime) {
        toPushToCloud.push(local)
      } else if (cloudTime > localTime) {
        toPullToLocal.push(cloud)
      }
    }
  }

  if (toPullToLocal.length > 0) {
    upsertRecordsRaw(toPullToLocal)
  }

  if (toPushToCloud.length > 0) {
    const pushed = await cloudAddRecords(toPushToCloud)
    // 推送後讀回伺服器指派的 updatedAt，讓本機與雲端的時間戳一致，避免裝置時鐘誤差累積。
    upsertRecordsRaw(pushed)
  }
}

async function syncSettings() {
  const localSettings = localGetSettings()
  const cloudSettings = await cloudGetSettings()

  const localTime = localSettings.updatedAt ? new Date(localSettings.updatedAt).getTime() : 0
  const cloudTime = cloudSettings?.updatedAt ? new Date(cloudSettings.updatedAt).getTime() : 0

  if (cloudSettings && cloudTime > localTime) {
    saveSettingsRaw(cloudSettings)
  } else if (localTime > cloudTime) {
    const pushed = await cloudSaveSettings(localSettings)
    saveSettingsRaw(pushed)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => runSync())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runSync()
  })
  // App 啟動時如果已經啟用同步，跑一次補同步
  if (getStoredCode()) runSync()
}
