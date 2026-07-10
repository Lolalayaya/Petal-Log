import { useState } from 'react'
import { SYMPTOM_OPTIONS, CUSTOM_SYMPTOM_COLOR_PALETTE } from '../../utils/symptoms'
import styles from './SettingsPanel.module.css'

const PHASES = [
  { key: 'menstrual', label: '月經期', toggleKey: 'showMenstrualPhase' },
  { key: 'follicular', label: '濾泡期', toggleKey: 'showFollicularPhase' },
  { key: 'ovulation', label: '排卵期', toggleKey: 'showOvulationPhase' },
  { key: 'luteal', label: '黃體期', toggleKey: 'showLutealPhase' },
]

export function SettingsPanel({ isOpen, settings, onClose, onUpdateSettings, onResetAllData, onOpenReport }) {
  const [newSymptomLabel, setNewSymptomLabel] = useState('')
  const [isSymptomSectionExpanded, setSymptomSectionExpanded] = useState(false)

  if (!isOpen) return null

  const handleReset = () => {
    const confirmed = window.confirm('確定要清除所有本機紀錄嗎？此動作無法復原。')
    if (confirmed) {
      onResetAllData()
      onClose()
    }
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

        <label className={styles.row}>
          <span>顯示排卵日與易孕期預測</span>
          <input
            type="checkbox"
            checked={settings.showOvulationPrediction}
            onChange={(e) => onUpdateSettings({ showOvulationPrediction: e.target.checked })}
          />
        </label>

        <div className={styles.sectionLabel}>週期階段顏色提示（月曆上標示）</div>

        {PHASES.map((phase) => (
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

        <button type="button" className={styles.dangerButton} onClick={handleReset}>
          清除所有本機紀錄
        </button>
      </div>
    </div>
  )
}
