export const SYMPTOM_OPTIONS = [
  { value: 'cramps', label: '經痛', defaultColor: '#b5645c' },
  { value: 'headache', label: '頭痛', defaultColor: '#c98a2b' },
  { value: 'bloating', label: '水腫', defaultColor: '#6f8fb0' },
  { value: 'lowMood', label: '情緒低落', defaultColor: '#8a7aa8' },
  { value: 'dizzyNausea', label: '頭暈想吐', defaultColor: '#4f9d8c' },
  { value: 'backache', label: '腰酸', defaultColor: '#a8763f' },
  { value: 'breastTenderness', label: '乳房腫脹', defaultColor: '#b98aa0' },
  { value: 'abdominalPain', label: '腹部悶痛', defaultColor: '#7a8c6b' },
  { value: 'limbSwelling', label: '手腳水腫', defaultColor: '#5b8fa3' },
  { value: 'digestiveDiscomfort', label: '腸胃不適', defaultColor: '#9b8ac4' },
]

// 尚未被使用者指定顏色的自訂症狀，依序從這個色盤挑選預設色。
export const CUSTOM_SYMPTOM_COLOR_PALETTE = [
  '#b5645c', '#c98a2b', '#6f8fb0', '#8a7aa8', '#4f9d8c',
  '#a8763f', '#b98aa0', '#7a8c6b', '#5b8fa3', '#9b8ac4',
]

// 統計每個症狀在所有紀錄中出現的次數，供報表使用；同時回傳所有「其他」自由文字備註（依日期排序）。
export function summarizeSymptoms(records, customSymptoms = []) {
  const labelByValue = new Map([
    ...SYMPTOM_OPTIONS.map((s) => [s.value, s.label]),
    ...customSymptoms.map((s) => [s.id, s.label]),
  ])

  const counts = new Map()
  const notes = []

  records.forEach((record) => {
    ;(record.symptoms ?? []).forEach((value) => {
      const label = labelByValue.get(value) ?? value
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })
    if (record.symptomNote) {
      notes.push({ date: record.date, note: record.symptomNote })
    }
  })

  const symptomFrequency = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  notes.sort((a, b) => a.date.localeCompare(b.date))

  return { symptomFrequency, notes }
}
