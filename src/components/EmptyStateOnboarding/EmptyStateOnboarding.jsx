import styles from './EmptyStateOnboarding.module.css'

export function EmptyStateOnboarding({ onStart }) {
  return (
    <div className={styles.container}>
      <p className={styles.message}>還沒有任何紀錄，從今天開始吧</p>
      <button type="button" className={styles.cta} onClick={onStart}>
        開始第一筆記錄
      </button>
    </div>
  )
}
