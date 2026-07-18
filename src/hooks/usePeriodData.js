import { useCallback, useMemo, useState } from 'react'
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import {
  getRecords,
  addRecord as addRecordToStorage,
  addRecords as addRecordsToStorage,
  updateRecord as updateRecordInStorage,
  deleteRecord as deleteRecordFromStorage,
  getSettings,
  saveSettings as saveSettingsToStorage,
  clearAllData,
} from '../data/storage'
import { getCyclePrediction, groupIntoCycles } from '../utils/cyclePrediction'
import { estimateSubsequentFlow } from '../utils/flowEstimate'

// 兩次經期起始日相隔天數若小於這個門檻，生理上幾乎不可能是新的一次經期，
// 多半是誤點或不正常出血，因此不自動產生後續估算天數，只提示使用者留意。
const MIN_CYCLE_GAP_DAYS = 15

// 使用者分別記錄了「頭」跟「尾」兩天、中間卻沒填時，只要接起來後整段經期長度
// 不超過這個天數，就視為同一次經期忘了填中間，自動補上估算天數；超過這個天數
// （代表接起來已經不合理地長）則交給下方的新經期／間隔過短判斷處理，避免把明顯
// 是兩次不同經期的紀錄誤接在一起。
const MAX_BRIDGEABLE_PERIOD_LENGTH = 10

export function usePeriodData() {
  const [records, setRecords] = useState(() => getRecords())
  const [settings, setSettings] = useState(() => getSettings())

  const recordByDate = useMemo(() => {
    const map = new Map()
    records.forEach((r) => map.set(r.date, r))
    return map
  }, [records])

  const prediction = useMemo(() => getCyclePrediction(records, settings), [records, settings])

  const recordDay = useCallback((date, flow, symptoms = [], symptomNote = '') => {
    const existing = recordByDate.get(date)
    const recordId = existing ? existing.id : `${date}-${Date.now()}`

    const prevDay = format(subDays(parseISO(date), 1), 'yyyy-MM-dd')
    const nextDay = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')
    const isAdjacentToExisting = recordByDate.has(prevDay) || recordByDate.has(nextDay)

    if (isAdjacentToExisting) {
      // 已經緊接著既有紀錄（不管這天本身是新增還是重新編輯既有紀錄），代表這天早就
      // 接在同一次經期裡了，只需要更新這天自己的資料，不用再嘗試接其他經期。
      setRecords(addRecordToStorage({ id: recordId, date, flow, symptoms, symptomNote, isEstimated: false }))
      return {}
    }

    const sortedDates = [...recordByDate.keys()].sort()
    const cycles = groupIntoCycles(sortedDates)

    // 這天目前前後都沒有相鄰的紀錄，是孤立的一天：不管是新增，還是重新編輯／確認一筆
    // 之前（例如因為當時關閉自動填充）沒接上的既有孤立紀錄，只要旁邊有既有經期、且接
    // 起來後整段經期長度仍在合理範圍內，就自動補上中間空缺的天數，不用使用者手動一天
    // 一天補、也不用刪掉重記。跟前一個既有經期接起來會過長（超過
    // MAX_BRIDGEABLE_PERIOD_LENGTH）時則不接，交給下面的新經期／間隔過短判斷處理，
    // 避免把兩次不同的經期誤接成一次。
    if (settings.autoFillSubsequentDays) {
      const backwardCycle = cycles.filter((c) => c.lastDate < date).pop() ?? null
      if (backwardCycle) {
        const totalLength = differenceInCalendarDays(parseISO(date), parseISO(backwardCycle.startDate)) + 1
        if (totalLength <= MAX_BRIDGEABLE_PERIOD_LENGTH) {
          const cycleStartFlow = recordByDate.get(backwardCycle.startDate).flow
          const gapRecords = []
          for (let i = 1; i < totalLength - 1; i++) {
            const d = format(addDays(parseISO(backwardCycle.startDate), i), 'yyyy-MM-dd')
            if (recordByDate.has(d)) continue
            gapRecords.push({
              id: `${d}-${Date.now()}-${i}`,
              date: d,
              flow: estimateSubsequentFlow(cycleStartFlow, i, totalLength),
              isEstimated: true,
              symptoms: [],
              symptomNote: '',
            })
          }
          gapRecords.push({ id: recordId, date, flow, symptoms, symptomNote, isEstimated: false })
          setRecords(addRecordsToStorage(gapRecords))
          return {}
        }
      }

      const forwardCycle = cycles.find((c) => c.startDate > date) ?? null
      if (forwardCycle) {
        const totalLength = differenceInCalendarDays(parseISO(forwardCycle.lastDate), parseISO(date)) + 1
        if (totalLength <= MAX_BRIDGEABLE_PERIOD_LENGTH) {
          const gapRecords = [{ id: recordId, date, flow, symptoms, symptomNote, isEstimated: false }]
          for (let i = 1; i < totalLength - 1; i++) {
            const d = format(addDays(parseISO(date), i), 'yyyy-MM-dd')
            if (recordByDate.has(d)) continue
            gapRecords.push({
              id: `${d}-${Date.now()}-${i}`,
              date: d,
              flow: estimateSubsequentFlow(flow, i, totalLength),
              isEstimated: true,
              symptoms: [],
              symptomNote: '',
            })
          }
          setRecords(addRecordsToStorage(gapRecords))
          return {}
        }
      }
    }

    if (existing) {
      // 孤立的既有紀錄，旁邊沒有能接上的經期：單純更新這天自己的資料，不觸發新經期的
      // 後續估算天數（避免使用者只是想改一天的經量，卻無中生有多出好幾天估算紀錄）。
      setRecords(addRecordToStorage({ id: recordId, date, flow, symptoms, symptomNote, isEstimated: false }))
      return {}
    }

    // 找出這個新起始日之前、最近一次已知經期的起始日，檢查間隔是否短到不合常理。
    const precedingCycle = cycles.filter((c) => c.startDate < date).pop() ?? null
    const gapDays = precedingCycle
      ? differenceInCalendarDays(parseISO(date), parseISO(precedingCycle.startDate))
      : null
    const shortGapWarning = gapDays !== null && gapDays < MIN_CYCLE_GAP_DAYS

    // 間隔過短時不自動產生後續估算天數，避免把不可能的「新經期」誤判擴散成一整串錯誤紀錄，
    // 但仍記錄使用者實際點的這一天，並回傳提示讓畫面顯示警示（不擋下新增）。
    if (settings.autoFillSubsequentDays && !shortGapWarning) {
      const periodLength = prediction.averagePeriodLength || settings.avgPeriodLength
      const newRecords = Array.from({ length: periodLength }, (_, i) => {
        const d = format(addDays(parseISO(date), i), 'yyyy-MM-dd')
        return {
          id: `${d}-${Date.now()}-${i}`,
          date: d,
          flow: i === 0 ? flow : estimateSubsequentFlow(flow, i, periodLength),
          isEstimated: i !== 0,
          symptoms: i === 0 ? symptoms : [],
          symptomNote: i === 0 ? symptomNote : '',
        }
      })
      setRecords(addRecordsToStorage(newRecords))
      return { shortGapWarning: false }
    }

    setRecords(addRecordToStorage({ id: `${date}-${Date.now()}`, date, flow, symptoms, symptomNote, isEstimated: false }))
    return { shortGapWarning, gapDays }
  }, [recordByDate, settings, prediction])

  const editRecord = useCallback((id, patch) => {
    setRecords(updateRecordInStorage(id, patch))
  }, [])

  const removeRecord = useCallback((id) => {
    setRecords(deleteRecordFromStorage(id))
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings(saveSettingsToStorage({ ...settings, ...patch }))
  }, [settings])

  const resetAllData = useCallback(() => {
    clearAllData()
    setRecords([])
    setSettings(getSettings())
  }, [])

  // 供雲端同步層使用：背景把資料寫進 localStorage 後，用這個把結果重新讀回 React state，
  // 觸發已掛載畫面的重新渲染（同步層的寫入不會自動觸發 usePeriodData 的 re-render）。
  const refreshFromStorage = useCallback(() => {
    setRecords(getRecords())
    setSettings(getSettings())
  }, [])

  return {
    records,
    recordByDate,
    prediction,
    settings,
    recordDay,
    editRecord,
    removeRecord,
    updateSettings,
    resetAllData,
    refreshFromStorage,
  }
}
