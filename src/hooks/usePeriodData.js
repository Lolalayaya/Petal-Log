import { useCallback, useMemo, useState } from 'react'
import { addDays, format, parseISO, subDays } from 'date-fns'
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
import { getCyclePrediction } from '../utils/cyclePrediction'

export function usePeriodData() {
  const [records, setRecords] = useState(() => getRecords())
  const [settings, setSettings] = useState(() => getSettings())

  const recordByDate = useMemo(() => {
    const map = new Map()
    records.forEach((r) => map.set(r.date, r))
    return map
  }, [records])

  const prediction = useMemo(() => getCyclePrediction(records, settings), [records, settings])

  const recordDay = useCallback((date, flow) => {
    const existing = recordByDate.get(date)
    if (existing) {
      setRecords(addRecordToStorage({ id: existing.id, date, flow }))
      return
    }

    const prevDay = format(subDays(parseISO(date), 1), 'yyyy-MM-dd')
    const isNewCycleStart = !recordByDate.has(prevDay)

    if (isNewCycleStart && settings.autoFillSubsequentDays) {
      const periodLength = prediction.averagePeriodLength || settings.avgPeriodLength
      const newRecords = Array.from({ length: periodLength }, (_, i) => {
        const d = format(addDays(parseISO(date), i), 'yyyy-MM-dd')
        return { id: `${d}-${Date.now()}-${i}`, date: d, flow }
      })
      setRecords(addRecordsToStorage(newRecords))
      return
    }

    setRecords(addRecordToStorage({ id: `${date}-${Date.now()}`, date, flow }))
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
  }
}
