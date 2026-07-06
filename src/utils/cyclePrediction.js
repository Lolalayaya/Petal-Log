import { parseISO, differenceInCalendarDays, addDays, format } from 'date-fns'

// 經期天數 = 一次出血持續幾天
// 週期天數 = 從「這次生理期第一天」到「下一次生理期第一天」的間隔天數

function groupIntoCycles(sortedDates) {
  const cycles = []
  sortedDates.forEach((dateStr) => {
    const current = cycles[cycles.length - 1]
    if (current && differenceInCalendarDays(parseISO(dateStr), parseISO(current.lastDate)) <= 1) {
      current.lastDate = dateStr
      current.length += 1
    } else {
      cycles.push({ startDate: dateStr, lastDate: dateStr, length: 1 })
    }
  })
  return cycles
}

export function getDayOfPeriod(records, date) {
  const sortedDates = [...new Set(records.map((r) => r.date))].sort()
  if (!sortedDates.includes(date)) return null

  const cycles = groupIntoCycles(sortedDates)
  const cycle = cycles.find((c) => {
    const diff = differenceInCalendarDays(parseISO(date), parseISO(c.startDate))
    return diff >= 0 && diff < c.length
  })
  if (!cycle) return null

  return differenceInCalendarDays(parseISO(date), parseISO(cycle.startDate)) + 1
}

export function getCyclePrediction(records, settings, today = new Date()) {
  if (!records.length) {
    return {
      hasData: false,
      currentCycleDay: null,
      nextPredictedDate: null,
      averageCycleLength: null,
      averagePeriodLength: null,
      predictedDates: [],
    }
  }

  const sortedDates = [...new Set(records.map((r) => r.date))].sort()
  const cycles = groupIntoCycles(sortedDates)
  const lastCycle = cycles[cycles.length - 1]
  const priorCycles = cycles.slice(0, -1)

  let averageCycleLength = settings.avgCycleLength
  if (cycles.length >= 2) {
    const intervals = []
    for (let i = 1; i < cycles.length; i++) {
      intervals.push(differenceInCalendarDays(parseISO(cycles[i].startDate), parseISO(cycles[i - 1].startDate)))
    }
    averageCycleLength = Math.round(intervals.reduce((sum, n) => sum + n, 0) / intervals.length)
  }

  let averagePeriodLength = settings.avgPeriodLength
  if (priorCycles.length > 0) {
    averagePeriodLength = Math.round(priorCycles.reduce((sum, c) => sum + c.length, 0) / priorCycles.length)
  }

  const lastStart = parseISO(lastCycle.startDate)
  const nextPredictedDate = format(addDays(lastStart, averageCycleLength), 'yyyy-MM-dd')

  // 「第幾天」只能算「今天以前（含今天）已經開始」的那一次週期，
  // 避免使用者手動輸入未來日期的紀錄時，找不到今天對應第幾天而整個消失
  const pastCycles = cycles.filter((c) => differenceInCalendarDays(parseISO(c.startDate), today) <= 0)
  const referenceCycle = pastCycles[pastCycles.length - 1] ?? null
  const currentCycleDay = referenceCycle
    ? differenceInCalendarDays(today, parseISO(referenceCycle.startDate)) + 1
    : null

  const predictedDates = []
  const nextStart = parseISO(nextPredictedDate)
  for (let i = 0; i < averagePeriodLength; i++) {
    predictedDates.push(format(addDays(nextStart, i), 'yyyy-MM-dd'))
  }

  if (referenceCycle && !settings.autoFillSubsequentDays && currentCycleDay > 0 && currentCycleDay < averagePeriodLength) {
    const recordedDates = new Set(sortedDates)
    const refStart = parseISO(referenceCycle.startDate)
    for (let i = currentCycleDay; i < averagePeriodLength; i++) {
      const dateStr = format(addDays(refStart, i), 'yyyy-MM-dd')
      if (!recordedDates.has(dateStr)) predictedDates.push(dateStr)
    }
  }

  return {
    hasData: true,
    currentCycleDay,
    nextPredictedDate,
    averageCycleLength,
    averagePeriodLength,
    predictedDates,
  }
}
