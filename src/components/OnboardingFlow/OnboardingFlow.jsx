import { useState } from 'react'
import styles from './OnboardingFlow.module.css'

export function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState('ask')
  const [periodLength, setPeriodLength] = useState('5')
  const [cycleLength, setCycleLength] = useState('28')

  if (step === 'ask') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>歡迎使用 Petal Log</h1>
        <p className={styles.message}>你有過去的生理期紀錄嗎？提供大概的天數，能讓預測更準確。</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={() => setStep('input')}>
            有，我想輸入
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onComplete({ avgPeriodLength: 5, avgCycleLength: 28 })}
          >
            沒有，先用預設值
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>大概的週期資訊</h1>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>每次經期大約幾天</span>
        <input
          type="number"
          min="1"
          max="14"
          value={periodLength}
          onChange={(e) => setPeriodLength(e.target.value)}
          className={styles.numberInput}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>大約幾天來一次（這次到下次第一天）</span>
        <input
          type="number"
          min="15"
          max="60"
          value={cycleLength}
          onChange={(e) => setCycleLength(e.target.value)}
          className={styles.numberInput}
        />
      </label>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={() =>
          onComplete({
            avgPeriodLength: Number(periodLength) || 5,
            avgCycleLength: Number(cycleLength) || 28,
          })
        }
      >
        完成設定
      </button>
    </div>
  )
}
