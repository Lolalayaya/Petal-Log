import { useState } from 'react'
import { SYMPTOM_OPTIONS } from '../../utils/symptoms'
import styles from './SymptomPicker.module.css'

export function SymptomPicker({
  value = [],
  onChange,
  note = '',
  onNoteChange,
  customSymptoms = [],
  symptomColors = {},
  hiddenSymptoms = [],
}) {
  const [otherOpen, setOtherOpen] = useState(Boolean(note))

  const options = [
    ...SYMPTOM_OPTIONS.filter((s) => !hiddenSymptoms.includes(s.value)),
    ...customSymptoms.map((s) => ({ value: s.id, label: s.label, defaultColor: '#9b8ac4' })),
  ]

  const toggle = (symptom) => {
    onChange(value.includes(symptom) ? value.filter((s) => s !== symptom) : [...value, symptom])
  }

  const toggleOther = () => {
    if (otherOpen) {
      setOtherOpen(false)
      onNoteChange('')
    } else {
      setOtherOpen(true)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.group} role="group" aria-label="伴隨症狀">
        {options.map((option) => {
          const isActive = value.includes(option.value)
          const color = symptomColors[option.value] || option.defaultColor
          return (
            <button
              type="button"
              key={option.value}
              aria-pressed={isActive}
              className={[styles.chip, isActive && styles.chipActive].filter(Boolean).join(' ')}
              style={isActive ? { background: color, borderColor: color } : undefined}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={otherOpen}
          className={[styles.chip, otherOpen && styles.chipActive].filter(Boolean).join(' ')}
          onClick={toggleOther}
        >
          其他
        </button>
      </div>
      {otherOpen && (
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="自行填寫..."
          className={styles.noteInput}
        />
      )}
    </div>
  )
}
