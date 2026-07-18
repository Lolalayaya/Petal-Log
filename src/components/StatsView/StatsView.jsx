import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { CycleLengthChart } from './CycleLengthChart'
import { FlowDistributionChart } from './FlowDistributionChart'
import styles from './StatsView.module.css'

const STATS_WINDOW_MONTHS = 6

export function StatsView({ records, prediction, onClose }) {
  const [isCycleSectionExpanded, setCycleSectionExpanded] = useState(true)
  const [isFlowSectionExpanded, setFlowSectionExpanded] = useState(true)

  const sinceDate = format(subMonths(new Date(), STATS_WINDOW_MONTHS), 'yyyy-MM-dd')

  const recentCycles = prediction.cycleHistory.filter((c) => c.startDate >= sinceDate && c.cycleLength !== null)

  const recentRecords = records.filter((r) => r.date >= sinceDate)
  const flowCounts = recentRecords.reduce(
    (acc, r) => {
      acc[r.flow] = (acc[r.flow] ?? 0) + 1
      return acc
    },
    { light: 0, medium: 0, heavy: 0, unknown: 0 }
  )

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <button type="button" className={styles.backButton} onClick={onClose}>
          ← 返回
        </button>
      </div>

      <h1 className={styles.title}>週期統計</h1>
      <p className={styles.meta}>資料範圍：近 {STATS_WINDOW_MONTHS} 個月的實際紀錄</p>

      <section className={styles.section}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setCycleSectionExpanded((v) => !v)}
          aria-expanded={isCycleSectionExpanded}
        >
          <h2 className={styles.sectionTitle}>近 {STATS_WINDOW_MONTHS} 個月週期天數趨勢</h2>
          <span className={styles.chevron} aria-hidden="true">
            {isCycleSectionExpanded ? '︿' : '﹀'}
          </span>
        </button>
        {isCycleSectionExpanded && (
          <>
            <CycleLengthChart cycles={recentCycles} averageCycleLength={prediction.averageCycleLength} />
            {recentCycles.length > 0 && (
              <p className={styles.disclaimer}>依這段期間內的實際紀錄計算，僅供參考，非醫療建議。</p>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setFlowSectionExpanded((v) => !v)}
          aria-expanded={isFlowSectionExpanded}
        >
          <h2 className={styles.sectionTitle}>經量分佈</h2>
          <span className={styles.chevron} aria-hidden="true">
            {isFlowSectionExpanded ? '︿' : '﹀'}
          </span>
        </button>
        {isFlowSectionExpanded && (
          <>
            <FlowDistributionChart counts={flowCounts} />
            {recentRecords.length > 0 && <p className={styles.disclaimer}>依這段期間內每日記錄的經量統計。</p>}
          </>
        )}
      </section>

      <p className={styles.footer}>由 Petal Log 產生，資料僅存於本機瀏覽器。</p>
    </div>
  )
}
