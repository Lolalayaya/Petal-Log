import { useEffect } from 'react'
import { getNotificationState, saveNotificationState } from '../data/storage'
import { getPermission, isReminderDue, buildReminderContent, showReminderNotification } from '../utils/notifications'

// 在 App 開啟／切回前景時檢查是否該跳提醒通知（見 SDD 14.1）。比照 syncManager.js 用事件
// 觸發、不用輪詢的既有慣例：mount 時檢查一次，之後只在分頁從背景切回前景時（visibilitychange）
// 再檢查一次，避免使用者長時間開著分頁時被漏掉。
export function useNotificationReminder(prediction, settings) {
  useEffect(() => {
    if (!settings.notificationsEnabled) return undefined

    const checkAndNotify = async () => {
      if (getPermission() !== 'granted') return
      const state = getNotificationState()
      if (!isReminderDue(prediction, settings, state)) return

      const content = buildReminderContent(prediction.daysUntilNextPeriod)
      const shown = await showReminderNotification(content)
      if (shown) saveNotificationState({ notifiedForDate: prediction.nextPredictedDate })
    }

    checkAndNotify()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkAndNotify()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [prediction, settings])
}
