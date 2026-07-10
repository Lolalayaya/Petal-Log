import { format } from 'date-fns'
import { summarizeSymptoms } from '../../utils/symptoms'
import styles from './ReportView.module.css'

export function ReportView({ records, prediction, settings, onClose }) {
  const {
    cycleHistory,
    averageCycleLength,
    averagePeriodLength,
    hasAnomalies,
    prolongedPeriodCount,
    irregularCycleCount,
  } = prediction

  const periodLengths = cycleHistory.map((c) => c.periodLength)
  const cycleLengths = cycleHistory.map((c) => c.cycleLength).filter((n) => n !== null)
  const periodLengthRange = periodLengths.length ? [Math.min(...periodLengths), Math.max(...periodLengths)] : null
  const cycleLengthRange = cycleLengths.length ? [Math.min(...cycleLengths), Math.max(...cycleLengths)] : null

  const sortedRecordDates = [...new Set(records.map((r) => r.date))].sort()
  const earliestDate = sortedRecordDates[0] ?? null
  const latestDate = sortedRecordDates[sortedRecordDates.length - 1] ?? null

  const { symptomFrequency, notes } = summarizeSymptoms(records, settings.customSymptoms)

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
        產生日期：{format(new Date(), 'yyyy-MM-dd')}
        {earliestDate && latestDate ? `　涵蓋區間：${earliestDate} ~ ${latestDate}` : ''}
      </p>

      {!prediction.hasData ? (
        <p className={styles.empty}>尚無足夠紀錄可產生報表。</p>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>摘要統計</h2>
            <ul className={styles.statList}>
              <li>已記錄週期數：{cycleHistory.length} 次</li>
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
                  <li>{irregularCycleCount} 次週期天數不規律（低於 21 天、高於 35 天，或與個人平均相差超過 7 天）</li>
                )}
                {prolongedPeriodCount > 0 && <li>{prolongedPeriodCount} 次經期天數過長（超過 7 天）</li>}
              </ul>
              <p className={styles.disclaimer}>以上僅為日曆推算提示，非醫療診斷，建議提供本報表給婦產科醫師作進一步評估。</p>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>週期歷史</h2>
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
                {cycleHistory.map((cycle) => (
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
