import { parseISO, differenceInCalendarDays, addDays, format } from 'date-fns'

// 經期天數 = 一次出血持續幾天
// 週期天數 = 從「這次生理期第一天」到「下一次生理期第一天」的間隔天數

// 排卵預測採用「黃體期固定 14 天」的通用假設（從排卵日到下次經期第一天間隔約 14 天），
// 易孕期則涵蓋精子存活時間（排卵前 5 天）與卵子存活時間（排卵後 1 天）。
// 這是日曆推算法的標準估算方式，非醫療診斷，週期不規律者準確度會下降。
const LUTEAL_PHASE_DAYS = 14
const FERTILE_DAYS_BEFORE_OVULATION = 5
const FERTILE_DAYS_AFTER_OVULATION = 1

// 平均值只取「最接近現在」的最多 6 次週期，避免久遠的紀錄拖累近期實際狀況的預測準確度。
const MAX_CYCLES_FOR_AVERAGE = 6

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

// 以「下次預計經期第一天」回推排卵日與易孕期區間。
function getFertilityPrediction(nextPredictedDate) {
  const nextStart = parseISO(nextPredictedDate)
  const ovulationDate = format(addDays(nextStart, -LUTEAL_PHASE_DAYS), 'yyyy-MM-dd')
  const fertileStart = addDays(nextStart, -LUTEAL_PHASE_DAYS - FERTILE_DAYS_BEFORE_OVULATION)
  const fertileEnd = addDays(nextStart, -LUTEAL_PHASE_DAYS + FERTILE_DAYS_AFTER_OVULATION)

  const fertileWindowDates = []
  const totalFertileDays = differenceInCalendarDays(fertileEnd, fertileStart) + 1
  for (let i = 0; i < totalFertileDays; i++) {
    fertileWindowDates.push(format(addDays(fertileStart, i), 'yyyy-MM-dd'))
  }

  return {
    ovulationDate,
    fertileWindowStart: format(fertileStart, 'yyyy-MM-dd'),
    fertileWindowEnd: format(fertileEnd, 'yyyy-MM-dd'),
    fertileWindowDates,
  }
}

function getDateRange(startDateStr, endDateStr) {
  const start = parseISO(startDateStr)
  const total = differenceInCalendarDays(parseISO(endDateStr), start) + 1
  if (total <= 0) return []

  const days = []
  for (let i = 0; i < total; i++) {
    days.push(format(addDays(start, i), 'yyyy-MM-dd'))
  }
  return days
}

// 將「這次生理期開始」到「下次預計生理期開始前一天」切分為月經期／濾泡期／排卵期／黃體期四階段。
// 濾泡期＝經期結束隔天至排卵前一天；黃體期＝排卵隔天至下次經期前一天；任一區間長度不足時回傳空陣列。
function getCyclePhases(cycleStartDate, averagePeriodLength, ovulationDate, nextPredictedDate) {
  const periodEnd = format(addDays(parseISO(cycleStartDate), averagePeriodLength - 1), 'yyyy-MM-dd')
  const follicularStart = format(addDays(parseISO(periodEnd), 1), 'yyyy-MM-dd')
  const follicularEnd = format(addDays(parseISO(ovulationDate), -1), 'yyyy-MM-dd')
  const lutealStart = format(addDays(parseISO(ovulationDate), 1), 'yyyy-MM-dd')
  const lutealEnd = format(addDays(parseISO(nextPredictedDate), -1), 'yyyy-MM-dd')

  return {
    menstrualPhaseDates: getDateRange(cycleStartDate, periodEnd),
    follicularPhaseDates: getDateRange(follicularStart, follicularEnd),
    ovulationPhaseDates: [ovulationDate],
    lutealPhaseDates: getDateRange(lutealStart, lutealEnd),
  }
}

export function getCyclePrediction(records, settings, today = new Date()) {
  if (!records.length) {
    return {
      hasData: false,
      currentCycleDay: null,
      isPeriodActive: false,
      daysUntilNextPeriod: null,
      nextPredictedDate: null,
      averageCycleLength: null,
      averagePeriodLength: null,
      predictedDates: [],
      ovulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
      fertileWindowDates: [],
      menstrualPhaseDates: [],
      follicularPhaseDates: [],
      ovulationPhaseDates: [],
      lutealPhaseDates: [],
    }
  }

  const sortedDates = [...new Set(records.map((r) => r.date))].sort()
  const cycles = groupIntoCycles(sortedDates)
  const lastCycle = cycles[cycles.length - 1]
  const priorCycles = cycles.slice(0, -1)

  // 只取最近 MAX_CYCLES_FOR_AVERAGE 次週期的起始日間隔來平均，更早的紀錄不再納入計算。
  const recentCyclesForInterval = cycles.slice(-(MAX_CYCLES_FOR_AVERAGE + 1))
  let averageCycleLength = settings.avgCycleLength
  if (recentCyclesForInterval.length >= 2) {
    const intervals = []
    for (let i = 1; i < recentCyclesForInterval.length; i++) {
      intervals.push(
        differenceInCalendarDays(parseISO(recentCyclesForInterval[i].startDate), parseISO(recentCyclesForInterval[i - 1].startDate))
      )
    }
    averageCycleLength = Math.round(intervals.reduce((sum, n) => sum + n, 0) / intervals.length)
  }

  // 同理，經期天數也只取最近 MAX_CYCLES_FOR_AVERAGE 次（不含最新一次）來平均。
  const recentPriorCycles = priorCycles.slice(-MAX_CYCLES_FOR_AVERAGE)
  let averagePeriodLength = settings.avgPeriodLength
  if (recentPriorCycles.length > 0) {
    averagePeriodLength = Math.round(recentPriorCycles.reduce((sum, c) => sum + c.length, 0) / recentPriorCycles.length)
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

  // 「本次週期第幾天」只有在生理期還在進行（今天落在最近一次連續紀錄範圍內）才有意義；
  // 生理期結束後改以「距離下次預計生理期還有幾天」呈現，避免顯示一個容易誤解的天數。
  const todayStr = format(today, 'yyyy-MM-dd')
  const isPeriodActive = referenceCycle
    ? todayStr >= referenceCycle.startDate && todayStr <= referenceCycle.lastDate
    : false
  const daysUntilNextPeriod = differenceInCalendarDays(parseISO(nextPredictedDate), today)

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

  const fertility = getFertilityPrediction(nextPredictedDate)
  const phases = getCyclePhases(lastCycle.startDate, averagePeriodLength, fertility.ovulationDate, nextPredictedDate)

  return {
    hasData: true,
    currentCycleDay,
    isPeriodActive,
    daysUntilNextPeriod,
    nextPredictedDate,
    averageCycleLength,
    averagePeriodLength,
    predictedDates,
    ...fertility,
    ...phases,
  }
}
