// 通知提醒的領域邏輯（見 SDD 14.1）。純函式為主，不依賴 React。
//
// 重要限制：這是「前景檢查」機制，不是背景推播。專案是純前端零後端架構，沒有推播伺服器，
// 只能在 App 被開啟或切回前景時檢查「現在是否該提醒」，App 完全沒開啟時不會跳通知。

export function isNotificationSupported() {
  return typeof Notification !== 'undefined'
}

export function getPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

// 判斷「現在」是否該跳提醒通知：預測資料齊全、使用者已開啟通知、今天落在
// [nextPredictedDate - reminderDaysBefore, nextPredictedDate] 區間內，且這個預計日期還沒提醒過。
export function isReminderDue(prediction, settings, notificationState) {
  if (!settings.notificationsEnabled) return false
  if (!prediction.hasData || prediction.daysUntilNextPeriod === null) return false
  if (notificationState.notifiedForDate === prediction.nextPredictedDate) return false
  return prediction.daysUntilNextPeriod >= 0 && prediction.daysUntilNextPeriod <= settings.reminderDaysBefore
}

// 文案固定採中性字眼（沿用 SDD 第 2 章原則），避免「經期」「生理期」等字眼出現在系統通知橫幅上。
export function buildReminderContent(daysUntilNextPeriod) {
  const body =
    daysUntilNextPeriod === 0
      ? '提醒：預計的記錄時間是今天，記得留意。'
      : `提醒：距離預計的記錄時間還有 ${daysUntilNextPeriod} 天。`
  return { title: 'Petal Log', body }
}

export async function showReminderNotification(content) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false

  const options = { body: content.body, icon: `${import.meta.env.BASE_URL}favicon.svg`, tag: 'petal-log-reminder' }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if (registration) {
        await registration.showNotification(content.title, options)
        return true
      }
    } catch {
      // 落到下面用 Notification 建構子重試
    }
  }

  try {
    new Notification(content.title, options)
    return true
  } catch {
    return false
  }
}
