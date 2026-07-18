import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { FlowPicker } from '../FlowPicker/FlowPicker'
import { SymptomPicker } from '../SymptomPicker/SymptomPicker'
import styles from './DayDetail.module.css'

export function DayDetail({
  date,
  record,
  dayOfPeriod,
  fertilityStatus,
  showSymptomTracking = false,
  customSymptoms = [],
  symptomColors = {},
  hiddenSymptoms = [],
  onClose,
  onSave,
  onDelete,
  label = '記錄',
}) {
  const [flow, setFlow] = useState(record ? record.flow : 'unknown')
  const [symptoms, setSymptoms] = useState(record?.symptoms ?? [])
  const [symptomNote, setSymptomNote] = useState(record?.symptomNote ?? '')

  if (!date) return null

  const displayDate = format(parseISO(date), 'M月d日')

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{displayDate}</h2>
        {dayOfPeriod ? (
          <p className={styles.dayOfPeriod}>經期第 {dayOfPeriod} 天</p>
        ) : (
          <p className={styles.subLabel}>{label}</p>
        )}
        {fertilityStatus === 'ovulation' && <p className={styles.fertilityNote}>預測排卵日</p>}
        {fertilityStatus === 'fertile' && <p className={styles.fertilityNote}>預測易孕期</p>}
        {record?.isEstimated && (
          <p className={styles.estimatedNote}>此為系統依經期長度自動估算的天數，經量僅供參考，儲存後才會變成正式紀錄</p>
        )}

        <div className={styles.field}>
          <span className={styles.fieldLabel}>經量</span>
          <FlowPicker value={flow} onChange={setFlow} />
        </div>

        {showSymptomTracking && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>伴隨症狀</span>
            <SymptomPicker
              value={symptoms}
              onChange={setSymptoms}
              note={symptomNote}
              onNoteChange={setSymptomNote}
              customSymptoms={customSymptoms}
              symptomColors={symptomColors}
              hiddenSymptoms={hiddenSymptoms}
            />
          </div>
        )}

        <div className={styles.actions}>
          {record && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => {
                onDelete(record.id)
                onClose()
              }}
            >
              刪除{label}
            </button>
          )}
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => {
              onSave(date, flow, symptoms, symptomNote)
              onClose()
            }}
          >
            {record ? (record.isEstimated ? '確認此天資料' : '更新') : label}
          </button>
        </div>
      </div>
    </div>
  )
}
