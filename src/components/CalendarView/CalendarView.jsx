import { useMemo, useState } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  getYear,
  getMonth,
  setYear,
  setMonth,
} from 'date-fns'
import styles from './CalendarView.module.css'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const DEFAULT_PHASE_COLORS = {
  menstrual: '#b5645c',
  follicular: '#c98a2b',
  ovulation: '#4f9d8c',
  luteal: '#6f8fb0',
}

export function CalendarView({
  currentMonth,
  onMonthChange,
  recordByDate,
  predictedDates,
  fertileWindowDates = [],
  ovulationDate = null,
  menstrualPhaseDates = [],
  follicularPhaseDates = [],
  ovulationPhaseDates = [],
  lutealPhaseDates = [],
  phaseColors = DEFAULT_PHASE_COLORS,
  onSelectDay,
}) {
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => getYear(currentMonth))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const openPicker = () => {
    setPickerYear(getYear(currentMonth))
    setPickerOpen(true)
  }

  const handlePickMonth = (monthIndex) => {
    onMonthChange(setMonth(setYear(currentMonth, pickerYear), monthIndex))
    setPickerOpen(false)
  }

  const predictedDateSet = useMemo(() => new Set(predictedDates), [predictedDates])
  const fertileDateSet = useMemo(() => new Set(fertileWindowDates), [fertileWindowDates])

  const phaseByDate = useMemo(() => {
    const map = new Map()
    menstrualPhaseDates.forEach((d) => map.set(d, 'menstrual'))
    follicularPhaseDates.forEach((d) => map.set(d, 'follicular'))
    ovulationPhaseDates.forEach((d) => map.set(d, 'ovulation'))
    lutealPhaseDates.forEach((d) => map.set(d, 'luteal'))
    return map
  }, [menstrualPhaseDates, follicularPhaseDates, ovulationPhaseDates, lutealPhaseDates])

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="上個月"
        >
          ‹
        </button>
        <button type="button" className={styles.monthTitle} onClick={openPicker}>
          {format(currentMonth, 'yyyy年 M月')}
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      {isPickerOpen && (
        <div className={styles.pickerOverlay} onClick={() => setPickerOpen(false)}>
          <div className={styles.pickerPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerYearRow}>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setPickerYear((y) => y - 1)}
                aria-label="上一年"
              >
                ‹
              </button>
              <span className={styles.pickerYearLabel}>{pickerYear}年</span>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setPickerYear((y) => y + 1)}
                aria-label="下一年"
              >
                ›
              </button>
            </div>
            <div className={styles.pickerMonthGrid}>
              {MONTH_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={[
                    styles.pickerMonthCell,
                    pickerYear === getYear(currentMonth) && i === getMonth(currentMonth) && styles.pickerMonthCellActive,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handlePickMonth(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekdayLabel}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const record = recordByDate.get(dateStr)
          const isPredicted = predictedDateSet.has(dateStr)
          const isOvulation = dateStr === ovulationDate
          const isFertile = fertileDateSet.has(dateStr) && !isOvulation
          const inMonth = isSameMonth(day, currentMonth)
          const phase = phaseByDate.get(dateStr)

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              className={[
                styles.day,
                !inMonth && styles.dayOutside,
                record && !record.isEstimated && styles.dayRecorded,
                record && record.isEstimated && styles.dayEstimated,
                isPredicted && !record && styles.dayPredicted,
                isToday(day) && styles.dayToday,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {phase && (
                <span
                  className={styles.phaseIndicator}
                  style={{ background: phaseColors[phase] }}
                  aria-hidden="true"
                />
              )}
              {format(day, 'd')}
              {isOvulation && <span className={styles.ovulationMarker} aria-hidden="true" />}
              {isFertile && <span className={styles.fertileMarker} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
