import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { FlowPicker } from '../FlowPicker/FlowPicker'
import styles from './DayDetail.module.css'

export function DayDetail({ date, record, dayOfPeriod, onClose, onSave, onDelete, label = '記錄' }) {
  const [flow, setFlow] = useState(record ? record.flow : 'medium')

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

        <div className={styles.field}>
          <span className={styles.fieldLabel}>經量</span>
          <FlowPicker value={flow} onChange={setFlow} />
        </div>

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
              onSave(date, flow)
              onClose()
            }}
          >
            {record ? '更新' : label}
          </button>
        </div>
      </div>
    </div>
  )
}
