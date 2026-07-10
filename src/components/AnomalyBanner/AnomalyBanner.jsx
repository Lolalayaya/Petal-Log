import styles from './AnomalyBanner.module.css'

export function AnomalyBanner({ prediction, onViewReport }) {
  if (!prediction.hasAnomalies) return null

  const messages = []
  if (prediction.irregularCycleCount > 0) {
    messages.push(`${prediction.irregularCycleCount} 次週期天數不規律`)
  }
  if (prediction.prolongedPeriodCount > 0) {
    messages.push(`${prediction.prolongedPeriodCount} 次經期天數過長`)
  }

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>偵測到{messages.join('、')}，建議產生報表供婦產科醫師參考。</p>
      <button type="button" className={styles.reportButton} onClick={onViewReport}>
        查看報表
      </button>
    </div>
  )
}
