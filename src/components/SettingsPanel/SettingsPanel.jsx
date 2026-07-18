import { useState } from 'react'
import { SYMPTOM_OPTIONS, CUSTOM_SYMPTOM_COLOR_PALETTE } from '../../utils/symptoms'
import { THEME_LABELS } from '../../utils/syncCode'
import { isNotificationSupported, getPermission, requestPermission } from '../../utils/notifications'
import { StatsPreview } from '../StatsView/StatsPreview'
import styles from './SettingsPanel.module.css'

const PHASES = [
  { key: 'menstrual', label: '月經期', toggleKey: 'showMenstrualPhase' },
  { key: 'follicular', label: '濾泡期', toggleKey: 'showFollicularPhase' },
  { key: 'ovulation', label: '排卵期', toggleKey: 'showOvulationPhase' },
  { key: 'luteal', label: '黃體期', toggleKey: 'showLutealPhase' },
]

const SYNC_ERROR_MESSAGES = {
  'not-configured': '雲端同步尚未設定',
  'bad-format': '同步碼格式不正確，請確認有沒有打錯',
  'checksum-mismatch': '同步碼似乎有誤，請確認每個字元都輸入正確',
  'sign-up-failed': '建立同步失敗，請稍後再試',
  'sign-in-failed': '找不到這組同步碼對應的資料，請確認輸入是否正確',
}

export function SettingsPanel({
  isOpen,
  settings,
  records,
  prediction,
  onClose,
  onUpdateSettings,
  onResetAllData,
  onOpenReport,
  onOpenStats,
  cloudSync,
}) {
  const [newSymptomLabel, setNewSymptomLabel] = useState('')
  const [isSymptomSectionExpanded, setSymptomSectionExpanded] = useState(false)
  const [isPhaseSectionExpanded, setPhaseSectionExpanded] = useState(false)
  const [isSyncSectionExpanded, setSyncSectionExpanded] = useState(false)
  const [isStatsSectionExpanded, setStatsSectionExpanded] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('random')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [pendingDecision, setPendingDecision] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(() => getPermission())

  if (!isOpen) return null

  const handleReset = () => {
    const message = cloudSync?.status.enabled
      ? '確定要清除所有紀錄嗎？這會連同雲端與其他已同步裝置的資料一起清除，此動作無法復原。'
      : '確定要清除所有本機紀錄嗎？此動作無法復原。'
    const confirmed = window.confirm(message)
    if (confirmed) {
      onResetAllData()
      onClose()
    }
  }

  const handleEnableSyncNew = async () => {
    setSyncBusy(true)
    setSyncError(null)
    const result = await cloudSync.enableSyncNew(selectedTheme === 'random' ? undefined : selectedTheme)
    setSyncBusy(false)
    if (result.error) {
      setSyncError(SYNC_ERROR_MESSAGES[result.error.type] || '發生未知錯誤，請稍後再試')
    }
  }

  const handleJoinSync = async () => {
    setSyncBusy(true)
    setSyncError(null)
    const result = await cloudSync.enableSyncJoin(joinCodeInput)
    setSyncBusy(false)
    if (result.error) {
      setSyncError(SYNC_ERROR_MESSAGES[result.error.type] || '發生未知錯誤，請稍後再試')
      return
    }
    if (result.needsDecision) {
      setPendingDecision(true)
      return
    }
    setJoinCodeInput('')
  }

  const handleResolveJoin = async (strategy) => {
    setSyncBusy(true)
    await cloudSync.resolveJoin(strategy)
    setSyncBusy(false)
    setPendingDecision(false)
    setJoinCodeInput('')
  }

  const handleCopyCode = async () => {
    const code = cloudSync.revealCode()
    try {
      await navigator.clipboard.writeText(code)
      setCopyFeedback('已複製')
    } catch {
      setCopyFeedback('複製失敗，請手動選取')
    }
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  const handleDisableSync = async () => {
    const confirmed = window.confirm(
      '確定要結束同步嗎？這台裝置之後不會再自動跟雲端同步，但雲端資料與其他裝置不受影響，之後可以再用同一組碼加入。'
    )
    if (!confirmed) return
    await cloudSync.disableSync()
  }

  const handleToggleNotifications = async (checked) => {
    if (checked && isNotificationSupported() && getPermission() === 'default') {
      const result = await requestPermission()
      setNotificationPermission(result)
    }
    onUpdateSettings({ notificationsEnabled: checked })
  }

  const updatePhaseColor = (phase, color) => {
    onUpdateSettings({ phaseColors: { ...settings.phaseColors, [phase]: color } })
  }

  const updateSymptomColor = (symptomKey, color) => {
    onUpdateSettings({ symptomColors: { ...settings.symptomColors, [symptomKey]: color } })
  }

  const addCustomSymptom = () => {
    const label = newSymptomLabel.trim()
    if (!label) return
    const id = `custom-${Date.now()}`
    const usedColors = settings.customSymptoms.length
    const color = CUSTOM_SYMPTOM_COLOR_PALETTE[usedColors % CUSTOM_SYMPTOM_COLOR_PALETTE.length]
    onUpdateSettings({
      customSymptoms: [...settings.customSymptoms, { id, label }],
      symptomColors: { ...settings.symptomColors, [id]: color },
    })
    setNewSymptomLabel('')
  }

  const removeCustomSymptom = (id) => {
    const { [id]: _removed, ...restColors } = settings.symptomColors
    onUpdateSettings({
      customSymptoms: settings.customSymptoms.filter((s) => s.id !== id),
      symptomColors: restColors,
    })
  }

  const toggleSymptomVisibility = (symptomValue) => {
    onUpdateSettings({
      hiddenSymptoms: settings.hiddenSymptoms.includes(symptomValue)
        ? settings.hiddenSymptoms.filter((v) => v !== symptomValue)
        : [...settings.hiddenSymptoms, symptomValue],
    })
  }

  const allSymptomsForColor = [
    ...SYMPTOM_OPTIONS.map((s) => ({ ...s, isCustom: false })),
    ...settings.customSymptoms.map((s) => ({ value: s.id, label: s.label, defaultColor: '#9b8ac4', isCustom: true })),
  ]

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
          <span>自動補上頭尾之間的空缺天數</span>
          <input
            type="checkbox"
            checked={settings.autoFillSubsequentDays}
            onChange={(e) => onUpdateSettings({ autoFillSubsequentDays: e.target.checked })}
          />
        </label>

        <label className={styles.row}>
          <span>顯示排卵日與易孕期預測</span>
          <input
            type="checkbox"
            checked={settings.showOvulationPrediction}
            onChange={(e) => onUpdateSettings({ showOvulationPrediction: e.target.checked })}
          />
        </label>

        {settings.showOvulationPrediction && (
          <>
            <button
              type="button"
              className={styles.accordionToggle}
              onClick={() => setPhaseSectionExpanded((v) => !v)}
              aria-expanded={isPhaseSectionExpanded}
            >
              <span>週期階段顏色提示（月曆上標示）</span>
              <span className={styles.chevron} aria-hidden="true">
                {isPhaseSectionExpanded ? '︿' : '﹀'}
              </span>
            </button>

            {isPhaseSectionExpanded &&
              PHASES.map((phase) => (
                <div key={phase.key} className={styles.row}>
                  <span
                    className={styles.clickableLabel}
                    onClick={() => onUpdateSettings({ [phase.toggleKey]: !settings[phase.toggleKey] })}
                  >
                    {phase.label}
                  </span>
                  <span className={styles.rowControls}>
                    <input
                      type="color"
                      value={settings.phaseColors[phase.key]}
                      onChange={(e) => updatePhaseColor(phase.key, e.target.value)}
                      className={styles.colorInput}
                      aria-label={`${phase.label}顏色`}
                    />
                    <input
                      type="checkbox"
                      checked={settings[phase.toggleKey]}
                      onChange={(e) => onUpdateSettings({ [phase.toggleKey]: e.target.checked })}
                    />
                  </span>
                </div>
              ))}
          </>
        )}

        <label className={styles.row}>
          <span>記錄伴隨症狀</span>
          <input
            type="checkbox"
            checked={settings.showSymptomTracking}
            onChange={(e) => onUpdateSettings({ showSymptomTracking: e.target.checked })}
          />
        </label>

        {settings.showSymptomTracking && (
          <>
            <button
              type="button"
              className={styles.accordionToggle}
              onClick={() => setSymptomSectionExpanded((v) => !v)}
              aria-expanded={isSymptomSectionExpanded}
            >
              <span>症狀項目與顏色設定</span>
              <span className={styles.chevron} aria-hidden="true">
                {isSymptomSectionExpanded ? '︿' : '﹀'}
              </span>
            </button>

            {isSymptomSectionExpanded && (
              <>
                <div className={styles.sectionLabel}>症狀顯示與顏色</div>
                {allSymptomsForColor.map((symptom) => (
                  <div key={symptom.value} className={styles.row}>
                    <span
                      className={symptom.isCustom ? undefined : styles.clickableLabel}
                      onClick={symptom.isCustom ? undefined : () => toggleSymptomVisibility(symptom.value)}
                    >
                      {symptom.label}
                    </span>
                    <span className={styles.rowControls}>
                      <input
                        type="color"
                        value={settings.symptomColors[symptom.value] || symptom.defaultColor}
                        onChange={(e) => updateSymptomColor(symptom.value, e.target.value)}
                        className={styles.colorInput}
                        aria-label={`${symptom.label}顏色`}
                      />
                      {!symptom.isCustom && (
                        <input
                          type="checkbox"
                          checked={!settings.hiddenSymptoms.includes(symptom.value)}
                          onChange={() => toggleSymptomVisibility(symptom.value)}
                          aria-label={`顯示${symptom.label}`}
                        />
                      )}
                    </span>
                  </div>
                ))}

                <div className={styles.sectionLabel}>自訂症狀</div>
                {settings.customSymptoms.map((symptom) => (
                  <div key={symptom.id} className={styles.row}>
                    <span>{symptom.label}</span>
                    <button
                      type="button"
                      className={styles.smallDeleteButton}
                      onClick={() => removeCustomSymptom(symptom.id)}
                    >
                      移除
                    </button>
                  </div>
                ))}
                <div className={styles.addSymptomRow}>
                  <input
                    type="text"
                    value={newSymptomLabel}
                    onChange={(e) => setNewSymptomLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomSymptom()
                      }
                    }}
                    placeholder="新增症狀名稱"
                    className={styles.textInput}
                  />
                  <button type="button" className={styles.addButton} onClick={addCustomSymptom}>
                    新增
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <div className={styles.sectionLabel}>數據與報表</div>

        <label className={styles.row}>
          <span>週期不規律／經期過長時提醒</span>
          <input
            type="checkbox"
            checked={settings.showAnomalyAlerts}
            onChange={(e) => onUpdateSettings({ showAnomalyAlerts: e.target.checked })}
          />
        </label>

        <button
          type="button"
          className={styles.reportEntryButton}
          onClick={() => {
            onOpenReport()
            onClose()
          }}
        >
          查看週期報表（可列印／存為 PDF）
        </button>

        <button
          type="button"
          className={styles.accordionToggle}
          onClick={() => setStatsSectionExpanded((v) => !v)}
          aria-expanded={isStatsSectionExpanded}
        >
          <span>週期圖表統計</span>
          <span className={styles.chevron} aria-hidden="true">
            {isStatsSectionExpanded ? '︿' : '﹀'}
          </span>
        </button>

        {isStatsSectionExpanded && (
          <StatsPreview
            records={records}
            cycleHistory={prediction.cycleHistory}
            onOpenStats={() => {
              onOpenStats()
              onClose()
            }}
          />
        )}

        <div className={styles.sectionLabel}>通知提醒（選配）</div>

        {!isNotificationSupported() ? (
          <p className={styles.syncHint}>此瀏覽器不支援通知功能，無法使用提醒。</p>
        ) : (
          <>
            <label className={styles.row}>
              <span>開啟提醒通知</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
              />
            </label>

            {settings.notificationsEnabled && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>預計時間前幾天提醒</span>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={settings.reminderDaysBefore}
                  onChange={(e) => onUpdateSettings({ reminderDaysBefore: Number(e.target.value) || 0 })}
                  className={styles.numberInput}
                />
              </label>
            )}

            {settings.notificationsEnabled && notificationPermission === 'denied' && (
              <p className={styles.syncHint}>瀏覽器通知權限已被拒絕，請至瀏覽器設定重新開啟才能收到提醒。</p>
            )}
          </>
        )}

        {cloudSync?.status.configured && (
          <>
            <button
              type="button"
              className={styles.accordionToggle}
              onClick={() => setSyncSectionExpanded((v) => !v)}
              aria-expanded={isSyncSectionExpanded}
            >
              <span>雲端同步（選配）</span>
              <span className={styles.chevron} aria-hidden="true">
                {isSyncSectionExpanded ? '︿' : '﹀'}
              </span>
            </button>

            {isSyncSectionExpanded && (
              <div className={styles.syncSection}>
                {cloudSync.status.enabled ? (
                  <>
                    <div className={styles.row}>
                      <span>同步碼</span>
                      <span className={styles.rowControls}>
                        <span className={styles.syncCodeDisplay}>••••••••••••</span>
                        <button type="button" className={styles.smallDeleteButton} onClick={handleCopyCode}>
                          {copyFeedback ?? '複製'}
                        </button>
                      </span>
                    </div>
                    <p className={styles.syncHint}>
                      這組碼等同密碼，請勿分享給他人；換裝置時貼上同一組碼即可還原資料。
                    </p>

                    <button type="button" className={styles.dangerButton} onClick={handleDisableSync}>
                      結束同步（僅限本機）
                    </button>
                  </>
                ) : (
                  <>
                    <p className={styles.syncHint}>
                      啟用後可在多個裝置間同步紀錄，或作為資料備份。不需要註冊帳號，只需要一組系統產生的同步碼。
                    </p>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>同步碼風格</span>
                      <select
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                        className={styles.numberInput}
                      >
                        <option value="random">隨機（由系統挑選）</option>
                        {Object.entries(THEME_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className={styles.reportEntryButton}
                      onClick={handleEnableSyncNew}
                      disabled={syncBusy}
                    >
                      啟用同步（建立新同步碼）
                    </button>

                    <div className={styles.addSymptomRow}>
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        placeholder="輸入已有的同步碼"
                        className={styles.textInput}
                      />
                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={handleJoinSync}
                        disabled={syncBusy || !joinCodeInput.trim()}
                      >
                        加入
                      </button>
                    </div>

                    {pendingDecision && (
                      <div className={styles.syncDecision}>
                        <p>這台裝置已經有本機紀錄，要怎麼處理？</p>
                        <button
                          type="button"
                          className={styles.reportEntryButton}
                          onClick={() => handleResolveJoin('merge')}
                          disabled={syncBusy}
                        >
                          合併雙方紀錄（建議）
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleResolveJoin('overwrite-with-cloud')}
                          disabled={syncBusy}
                        >
                          改用雲端資料（本機紀錄會被取代）
                        </button>
                      </div>
                    )}
                  </>
                )}

                {syncError && <p className={styles.syncError}>{syncError}</p>}
              </div>
            )}
          </>
        )}

        <button type="button" className={styles.dangerButton} onClick={handleReset}>
          {cloudSync?.status.enabled ? '清除所有紀錄（含雲端）' : '清除所有本機紀錄'}
        </button>
      </div>
    </div>
  )
}
