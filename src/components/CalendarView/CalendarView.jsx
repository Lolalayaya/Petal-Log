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

export function CalendarView({ currentMonth, onMonthChange, recordByDate, predictedDates, onSelectDay }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const predictedDateSet = useMemo(() => new Set(predictedDates), [predictedDates])

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
          const inMonth = isSameMonth(day, currentMonth)

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
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
