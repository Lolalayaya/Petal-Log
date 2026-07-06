import { format, parseISO } from 'date-fns'
import styles from './PredictionBanner.module.css'

export function PredictionBanner({ prediction }) {
  if (!prediction.hasData) return null

  return (
    <div className={styles.banner}>
      {prediction.currentCycleDay && (
        <div className={styles.stat}>
          <span className={styles.value}>第 {prediction.currentCycleDay} 天</span>
          <span className={styles.label}>本次週期</span>
        </div>
      )}
      <div className={styles.stat}>
        <span className={styles.value}>{format(parseISO(prediction.nextPredictedDate), 'M/d')}</span>
        <span className={styles.label}>預計下次</span>
      </div>
    </div>
  )
}
