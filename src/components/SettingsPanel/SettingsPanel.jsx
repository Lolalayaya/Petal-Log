import styles from './SettingsPanel.module.css'

export function SettingsPanel({ isOpen, settings, onClose, onUpdateSettings, onResetAllData }) {
  if (!isOpen) return null

  const handleReset = () => {
    const confirmed = window.confirm('確定要清除所有本機紀錄嗎？此動作無法復原。')
    if (confirmed) {
      onResetAllData()
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>設定</h2>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>每次經期大約幾天</span>
          <input
            type="number"
            min="1"
            max="14"
            value={settings.avgPeriodLength}
            onChange={(e) => onUpdateSettings({ avgPeriodLength: Number(e.target.value) || 1 })}
            className={styles.numberInput}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>大約幾天來一次（這次到下次第一天）</span>
          <input
            type="number"
            min="15"
            max="60"
            value={settings.avgCycleLength}
            onChange={(e) => onUpdateSettings({ avgCycleLength: Number(e.target.value) || 15 })}
            className={styles.numberInput}
          />
        </label>

        <label className={styles.row}>
          <span>選定第一天後自動記錄後續天數</span>
          <input
            type="checkbox"
            checked={settings.autoFillSubsequentDays}
            onChange={(e) => onUpdateSettings({ autoFillSubsequentDays: e.target.checked })}
          />
        </label>

        <label className={styles.row}>
          <span>通知與圖示使用中性文字</span>
          <input
            type="checkbox"
            checked={settings.neutralLanguage}
            onChange={(e) => onUpdateSettings({ neutralLanguage: e.target.checked })}
          />
        </label>

        <button type="button" className={styles.dangerButton} onClick={handleReset}>
          清除所有本機紀錄
        </button>
      </div>
    </div>
  )
}
