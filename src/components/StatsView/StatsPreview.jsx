import { format, subMonths } from 'date-fns'
import { CycleLengthChart } from './CycleLengthChart'
import { FlowDistributionChart } from './FlowDistributionChart'
import styles from './StatsPreview.module.css'

const STATS_WINDOW_MONTHS = 6

// SettingsPanel 內嵌的精簡預覽版：兩張圖表都用 compact 模式（省略座標軸文字、圖例、⚠ 標籤），
// 純粹作為「近況一覽」的縮圖，完整可讀的版本（含圖例、tooltip、數值）在 StatsView 全螢幕頁面。
export function StatsPreview({ records, cycleHistory, onOpenStats }) {
  const sinceDate = format(subMonths(new Date(), STATS_WINDOW_MONTHS), 'yyyy-MM-dd')

  const recentCycles = cycleHistory.filter((c) => c.startDate >= sinceDate && c.cycleLength !== null)
  const recentRecords = records.filter((r) => r.date >= sinceDate)
  const flowCounts = recentRecords.reduce(
    (acc, r) => {
      acc[r.flow] = (acc[r.flow] ?? 0) + 1
      return acc
    },
    { light: 0, medium: 0, heavy: 0, unknown: 0 }
  )

  return (
    <div className={styles.preview}>
      <div className={styles.chartBlock}>
        <span className={styles.chartLabel}>近 {STATS_WINDOW_MONTHS} 個月週期天數</span>
        <CycleLengthChart cycles={recentCycles} averageCycleLength={null} compact />
      </div>
      <div className={styles.chartBlock}>
        <span className={styles.chartLabel}>經量分佈</span>
        <FlowDistributionChart counts={flowCounts} compact />
      </div>
      <button type="button" className={styles.openButton} onClick={onOpenStats}>
        查看完整統計
      </button>
    </div>
  )
}
