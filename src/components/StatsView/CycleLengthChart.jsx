import styles from './CycleLengthChart.module.css'

const BAR_WIDTH = 20
const BAND_WIDTH = 40
const CHART_HEIGHT = 160
const COMPACT_HEIGHT = 72
const TOP_PADDING = 40
// compact 模式沒有座標軸日期標籤，底部不需要留 TOP_PADDING 那麼多空間；改把騰出來的高度
// 讓給數值標籤上方的留白（見下面 HEADROOM），避免長條頂到頂端把「28天」這類標籤推出畫布外，
// 跟外面 StatsPreview 的圖表標題文字疊在一起。
const COMPACT_BOTTOM_PADDING = 4
const AXIS_HEIGHT = 20
// maxValue 的留白比例：compact 版繪圖高度較小，同樣 15% 留白換算成的像素不夠放數值標籤，
// 拉高留白比例確保最高的長條上方仍有空間顯示天數。
const HEADROOM = { full: 1.15, compact: 1.4 }
// 平均線的文字標籤獨立佔一塊右側 gutter，不與長條共用繪圖區，避免標籤疊在長條上（見 dataviz skill：
// 標籤碰撞時不能疊放，要嘛移到留白處，要嘛移進 tooltip）。
const LABEL_GUTTER = 64

// 近 6 個月週期天數趨勢：一根長條一次週期，異常週期（isIrregularCycle）換成狀態色（amber）並附 ⚠ 圖示，
// 一般週期維持單一 rose 色（長條本身已經用長度表達天數，不需要再用顏色重複編碼數值，見 dataviz skill）。
export function CycleLengthChart({ cycles, averageCycleLength, compact = false }) {
  if (cycles.length === 0) {
    return <p className={styles.empty}>近 6 個月尚無足夠紀錄可產生統計圖表。</p>
  }

  const height = compact ? COMPACT_HEIGHT : CHART_HEIGHT
  const plotHeight = height - (compact ? COMPACT_BOTTOM_PADDING : TOP_PADDING)
  const barsWidth = cycles.length * BAND_WIDTH
  const showAverageLabel = !compact && averageCycleLength != null
  const width = barsWidth + (showAverageLabel ? LABEL_GUTTER : 0)
  const maxValue =
    Math.max(...cycles.map((c) => c.cycleLength), averageCycleLength ?? 0) * (compact ? HEADROOM.compact : HEADROOM.full) || 1

  const yFor = (value) => plotHeight - (value / maxValue) * plotHeight
  const hasAnomaly = cycles.some((c) => c.isIrregularCycle)

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height + (compact ? 0 : AXIS_HEIGHT)}`}
        role="img"
        aria-label="近 6 個月週期天數趨勢長條圖"
      >
        {averageCycleLength != null && (
          <>
            <line
              className={styles.averageLine}
              x1={0}
              x2={barsWidth}
              y1={yFor(averageCycleLength)}
              y2={yFor(averageCycleLength)}
            />
            {showAverageLabel && (
              <text className={styles.averageLabel} x={barsWidth + 8} y={yFor(averageCycleLength) + 3} textAnchor="start">
                平均 {averageCycleLength} 天
              </text>
            )}
          </>
        )}

        {cycles.map((cycle, i) => {
          const barHeight = plotHeight - yFor(cycle.cycleLength)
          const x = i * BAND_WIDTH + (BAND_WIDTH - BAR_WIDTH) / 2
          const y = yFor(cycle.cycleLength)
          const title = `${cycle.startDate}：${cycle.cycleLength} 天${cycle.isIrregularCycle ? '（不規律）' : ''}`
          return (
            <g key={cycle.startDate} tabIndex={0} aria-label={title} className={styles.bar}>
              <title>{title}</title>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={Math.max(barHeight, 1)}
                rx={4}
                className={cycle.isIrregularCycle ? styles.rectAnomaly : styles.rect}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={y - 6}
                textAnchor="middle"
                className={compact ? styles.valueLabelCompact : styles.valueLabel}
              >
                {cycle.cycleLength}天
              </text>
              {!compact && cycle.isIrregularCycle && (
                <text x={x + BAR_WIDTH / 2} y={y - 18} textAnchor="middle" className={styles.warningIcon}>
                  ⚠
                </text>
              )}
              {!compact && (
                <text x={x + BAR_WIDTH / 2} y={height + 14} textAnchor="middle" className={styles.axisLabel}>
                  {cycle.startDate.slice(5).replace('-', '/')}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} />
          週期天數
        </span>
        {hasAnomaly && (
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendSwatchAnomaly}`} />
            週期不規律 ⚠
          </span>
        )}
      </div>
    </div>
  )
}
