import { useState } from 'react'
import { format } from 'date-fns'
import { FlowPicker } from '../FlowPicker/FlowPicker'
import styles from './QuickRecordModal.module.css'

export function QuickRecordModal({ isOpen, onClose, onSave, label = '記錄' }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [flow, setFlow] = useState('unknown')

  if (!isOpen) return null

  const handleSave = () => {
    onSave(date, flow)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>快速{label}</h2>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>日期</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={styles.dateInput}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>經量</span>
          <FlowPicker value={flow} onChange={setFlow} />
        </div>

        <button type="button" className={styles.saveButton} onClick={handleSave}>
          儲存
        </button>
      </div>
    </div>
  )
}
