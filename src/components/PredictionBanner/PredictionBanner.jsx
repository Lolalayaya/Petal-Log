import { format, parseISO } from 'date-fns'
import styles from './PredictionBanner.module.css'

export function PredictionBanner({ prediction, showOvulationPrediction = true }) {
  if (!prediction.hasData) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.banner}>
        {prediction.currentCycleDay && (
          prediction.isPeriodActive ? (
            <div className={styles.stat}>
              <span className={styles.value}>第 {prediction.currentCycleDay} 天</span>
              <span className={styles.label}>本次週期</span>
            </div>
          ) : (
            <div className={styles.stat}>
              <span className={styles.value}>
                {prediction.daysUntilNextPeriod > 0
                  ? `${prediction.daysUntilNextPeriod} 天`
                  : prediction.daysUntilNextPeriod === 0
                    ? '就是今天'
                    : `${Math.abs(prediction.daysUntilNextPeriod)} 天`}
              </span>
              <span className={styles.label}>
                {prediction.daysUntilNextPeriod >= 0 ? '距離下次' : '已超過預計天數'}
              </span>
            </div>
          )
        )}
        <div className={styles.stat}>
          <span className={styles.value}>{format(parseISO(prediction.nextPredictedDate), 'M/d')}</span>
          <span className={styles.label}>預計下次</span>
        </div>
        {showOvulationPrediction && prediction.ovulationDate && (
          <div className={`${styles.stat} ${styles.statMint}`}>
            <span className={`${styles.value} ${styles.valueMint}`}>
              {format(parseISO(prediction.fertileWindowStart), 'M/d')}–{format(parseISO(prediction.fertileWindowEnd), 'M/d')}
            </span>
            <span className={styles.label}>易孕期</span>
          </div>
        )}
      </div>
      {showOvulationPrediction && prediction.ovulationDate && (
        <p className={styles.disclaimer}>排卵日／易孕期為日曆推算，僅供參考，避孕請搭配其他可靠方式。</p>
      )}
    </div>
  )
}
