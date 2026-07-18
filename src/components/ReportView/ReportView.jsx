import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { summarizeSymptoms } from '../../utils/symptoms'
import styles from './ReportView.module.css'

const RANGE_PRESETS = [
  { key: '3m', label: '近 3 個月' },
  { key: '6m', label: '近 6 個月' },
  { key: 'all', label: '全部' },
  { key: 'custom', label: '自訂區間' },
]

export function ReportView({ records, prediction, settings, onClose }) {
  const [rangeMode, setRangeMode] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const {
    cycleHistory,
    averageCycleLength,
    averagePeriodLength,
    hasAnomalies,
    prolongedPeriodCount,
    irregularCycleCount,
  } = prediction

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  let rangeStart = null
  let rangeEnd = todayStr
  if (rangeMode === '3m') rangeStart = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  else if (rangeMode === '6m') rangeStart = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
  else if (rangeMode === 'custom') {
    rangeStart = customStart || null
    rangeEnd = customEnd || todayStr
  }

  const inRange = (dateStr) => (!rangeStart || dateStr >= rangeStart) && dateStr <= rangeEnd

  // 週期歷史依起始日倒敘（越接近現在的排越上面），與月曆/資料儲存慣用的正序分開處理，
  // 不動 usePeriodData／cyclePrediction.js 既有的正序假設，只在報表顯示時反轉。
  const visibleCycleHistory = cycleHistory.filter((c) => inRange(c.startDate)).sort((a, b) => b.startDate.localeCompare(a.startDate))
  const visibleRecords = records.filter((r) => inRange(r.date))

  const periodLengths = visibleCycleHistory.map((c) => c.periodLength)
  const cycleLengths = visibleCycleHistory.map((c) => c.cycleLength).filter((n) => n !== null)
  const periodLengthRange = periodLengths.length ? [Math.min(...periodLengths), Math.max(...periodLengths)] : null
  const cycleLengthRange = cycleLengths.length ? [Math.min(...cycleLengths), Math.max(...cycleLengths)] : null

  const sortedVisibleRecordDates = [...new Set(visibleRecords.map((r) => r.date))].sort()
  const earliestDate = sortedVisibleRecordDates[0] ?? null
  const latestDate = sortedVisibleRecordDates[sortedVisibleRecordDates.length - 1] ?? null

  const { symptomFrequency, notes } = summarizeSymptoms(visibleRecords, settings.customSymptoms)

  return (
    <div className={styles.page}>
      <div className={`${styles.actions} ${styles.noPrint}`}>
        <button type="button" className={styles.backButton} onClick={onClose}>
          ← 返回
        </button>
        <button type="button" className={styles.printButton} onClick={() => window.print()}>
          列印／另存為 PDF
        </button>
      </div>

      <h1 className={styles.title}>Petal Log 週期報表</h1>
      <p className={styles.meta}>
        產生日期：{todayStr}
        {earliestDate && latestDate ? `　涵蓋區間：${earliestDate} ~ ${latestDate}` : ''}
      </p>

      <div className={`${styles.rangeBar} ${styles.noPrint}`}>
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`${styles.rangeButton} ${rangeMode === preset.key ? styles.rangeButtonActive : ''}`}
            onClick={() => setRangeMode(preset.key)}
          >
            {preset.label}
          </button>
        ))}
        {rangeMode === 'custom' && (
          <span className={styles.customRangeInputs}>
            <input
              type="date"
              value={customStart}
              max={customEnd || todayStr}
              onChange={(e) => setCustomStart(e.target.value)}
              className={styles.rangeDateInput}
              aria-label="自訂區間起始日"
            />
            <span>～</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              max={todayStr}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={styles.rangeDateInput}
              aria-label="自訂區間結束日"
            />
          </span>
        )}
      </div>

      {!prediction.hasData ? (
        <p className={styles.empty}>尚無足夠紀錄可產生報表。</p>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>摘要統計</h2>
            <ul className={styles.statList}>
              <li>已記錄週期數：{visibleCycleHistory.length} 次</li>
              <li>平均週期天數：{averageCycleLength ?? '—'} 天</li>
              <li>平均經期天數：{averagePeriodLength ?? '—'} 天</li>
              {cycleLengthRange && (
                <li>
                  週期天數範圍：{cycleLengthRange[0]} ~ {cycleLengthRange[1]} 天
                </li>
              )}
              {periodLengthRange && (
                <li>
                  經期天數範圍：{periodLengthRange[0]} ~ {periodLengthRange[1]} 天
                </li>
              )}
            </ul>
          </section>

          {hasAnomalies && (
            <section className={`${styles.section} ${styles.anomalySection}`}>
              <h2 className={styles.sectionTitle}>異常提醒</h2>
              <ul className={styles.statList}>
                {irregularCycleCount > 0 && (
                  <li>{irregularCycleCount} 次週期天數不規律（近 6 個月內，低於 21 天、高於 45 天，或與個人平均相差超過 7 天）</li>
                )}
                {prolongedPeriodCount > 0 && <li>{prolongedPeriodCount} 次經期天數過長（近 6 個月內，超過 8 天）</li>}
              </ul>
              <p className={styles.disclaimer}>以上僅為日曆推算提示，非醫療診斷，建議提供本報表給婦產科醫師作進一步評估。</p>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>週期歷史</h2>
            {visibleCycleHistory.length === 0 ? (
              <p className={styles.empty}>所選區間內沒有紀錄。</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>起始日</th>
                    <th>結束日</th>
                    <th>經期天數</th>
                    <th>週期天數</th>
                    <th>備註</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCycleHistory.map((cycle) => (
                    <tr
                      key={cycle.startDate}
                      className={cycle.isProlongedPeriod || cycle.isIrregularCycle ? styles.anomalyRow : undefined}
                    >
                      <td>{cycle.startDate}</td>
                      <td>{cycle.endDate}</td>
                      <td>
                        {cycle.periodLength}
                        {cycle.isProlongedPeriod && ' ⚠'}
                      </td>
                      <td>
                        {cycle.cycleLength ?? '（進行中）'}
                        {cycle.isIrregularCycle && ' ⚠'}
                      </td>
                      <td>{[cycle.isProlongedPeriod && '經期過長', cycle.isIrregularCycle && '週期不規律'].filter(Boolean).join('、')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {(symptomFrequency.length > 0 || notes.length > 0) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>伴隨症狀統計</h2>
              {symptomFrequency.length > 0 && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>症狀</th>
                      <th>出現次數</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symptomFrequency.map((s) => (
                      <tr key={s.label}>
                        <td>{s.label}</td>
                        <td>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {notes.length > 0 && (
                <>
                  <h3 className={styles.subTitle}>其他備註</h3>
                  <ul className={styles.noteList}>
                    {notes.map((n) => (
                      <li key={`${n.date}-${n.note}`}>
                        {n.date}：{n.note}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </>
      )}

      <p className={styles.footer}>由 Petal Log 產生，資料僅存於本機瀏覽器。</p>
    </div>
  )
}
