import { useMemo } from 'react'
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
} from 'date-fns'
import styles from './CalendarView.module.css'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

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
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

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
        <h1 className={styles.monthTitle}>{format(currentMonth, 'yyyy年 M月')}</h1>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="下個月"
        >
          ›
        </button>
      </div>

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
                record && styles.dayRecorded,
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
