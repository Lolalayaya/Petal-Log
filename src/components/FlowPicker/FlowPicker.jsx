import styles from './FlowPicker.module.css'

const FLOW_OPTIONS = [
  { value: 'light', label: '量少' },
  { value: 'medium', label: '量中' },
  { value: 'heavy', label: '量多' },
  { value: 'unknown', label: '未知' },
]

export function FlowPicker({ value, onChange }) {
  return (
    <div className={styles.group} role="radiogroup" aria-label="經量">
      {FLOW_OPTIONS.map((option) => (
        <button
          type="button"
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          className={[styles.chip, value === option.value && styles.chipActive].filter(Boolean).join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
