const FLOW_LEVELS = ['light', 'medium', 'heavy']

// 經期通常「前段量較多、後段量較少」，用第一天使用者實際選的經量當作上限，
// 依天數在期間中的位置分三段遞減估算，絕不會估出比第一天更多的量。
export function estimateSubsequentFlow(startFlow, dayIndex, periodLength) {
  if (dayIndex <= 0 || periodLength <= 1) return startFlow
  const startLevel = FLOW_LEVELS.indexOf(startFlow)
  if (startLevel <= 0) return startFlow

  const progress = dayIndex / (periodLength - 1)
  const step = progress <= 1 / 3 ? 0 : progress <= 2 / 3 ? 1 : 2
  return FLOW_LEVELS[Math.max(0, startLevel - step)]
}
