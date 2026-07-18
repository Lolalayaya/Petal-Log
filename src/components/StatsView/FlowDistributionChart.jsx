import styles from './FlowDistributionChart.module.css'

// 量少/量中/量多是同一個變數的三個遞增等級（ordinal），用單一色相、由淺到深的三階色階表達順序
// （見 dataviz skill 的 ordinal 色彩規則）；「未知」代表當天沒有測量/記得經量，屬性上不是量的
// 一個等級而是「缺值」，改用中性灰（沿用 --color-text-secondary）跟三階色階明確區隔，避免被誤讀成
// 「比量少更淺的量」。
const FLOW_LEVELS = [
  { key: 'light', label: '量少', textClass: 'labelInk' },
  { key: 'medium', label: '量中', textClass: 'labelLight' },
  { key: 'heavy', label: '量多', textClass: 'labelLight' },
  { key: 'unknown', label: '未知', textClass: 'labelLight' },
]

const BAR_HEIGHT = 36
const COMPACT_BAR_HEIGHT = 14
const GAP = 2
// 段落夠寬才把百分比直接印在色塊上（量測字寬前的保守門檻），太窄就交給下方永遠可見的圖例文字，
// 不硬塞進去被裁切（見 dataviz skill：標籤裝不下就不要放進色塊裡）。
const MIN_WIDTH_FOR_INLINE_LABEL = 28

export function FlowDistributionChart({ counts, compact = false }) {
  const total = FLOW_LEVELS.reduce((sum, level) => sum + (counts[level.key] ?? 0), 0)

  if (total === 0) {
    return <p className={styles.empty}>近 6 個月尚無足夠紀錄可產生統計圖表。</p>
  }

  const barHeight = compact ? COMPACT_BAR_HEIGHT : BAR_HEIGHT
  const width = 300
  let x = 0

  const segments = FLOW_LEVELS.map((level) => {
    const count = counts[level.key] ?? 0
    const segmentWidth = Math.max((count / total) * width - GAP, 0)
    const segment = { ...level, count, x, width: segmentWidth, percent: Math.round((count / total) * 100) }
    x += (count / total) * width
    return segment
  }).filter((segment) => segment.count > 0)

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${barHeight}`}
        role="img"
        aria-label="經量分佈比例圖"
        preserveAspectRatio="none"
      >
        {segments.map((segment) => (
          <g key={segment.key}>
            <rect
              x={segment.x}
              y={0}
              width={segment.width}
              height={barHeight}
              rx={4}
              className={styles[`segment_${segment.key}`]}
            >
              <title>
                {segment.label}：{segment.count} 天（{segment.percent}%）
              </title>
            </rect>
            {!compact && segment.width >= MIN_WIDTH_FOR_INLINE_LABEL && (
              <text
                x={segment.x + segment.width / 2}
                y={barHeight / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className={styles[segment.textClass]}
              >
                {segment.percent}%
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className={styles.legend}>
        {segments.map((segment) => (
          <span key={segment.key} className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles[`segment_${segment.key}`]}`} />
            {segment.label}　{segment.count} 天（{segment.percent}%）
          </span>
        ))}
      </div>
    </div>
  )
}
