import { useState } from 'react'
import { usePeriodData } from './hooks/usePeriodData'
import { CalendarView } from './components/CalendarView/CalendarView'
import { PredictionBanner } from './components/PredictionBanner/PredictionBanner'
import { QuickRecordModal } from './components/QuickRecordModal/QuickRecordModal'
import { DayDetail } from './components/DayDetail/DayDetail'
import { EmptyStateOnboarding } from './components/EmptyStateOnboarding/EmptyStateOnboarding'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { OnboardingFlow } from './components/OnboardingFlow/OnboardingFlow'
import { getDayOfPeriod } from './utils/cyclePrediction'
import styles from './App.module.css'

export default function App() {
  const {
    records,
    recordByDate,
    prediction,
    settings,
    recordDay,
    removeRecord,
    updateSettings,
    resetAllData,
  } = usePeriodData()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isQuickRecordOpen, setQuickRecordOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  const recordLabel = settings.neutralLanguage ? '記錄' : '經期記錄'

  if (!settings.onboardingCompleted) {
    return (
      <div className={styles.app}>
        <OnboardingFlow
          onComplete={({ avgPeriodLength, avgCycleLength }) =>
            updateSettings({ avgPeriodLength, avgCycleLength, onboardingCompleted: true })
          }
        />
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Petal Log</h1>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => setSettingsOpen(true)}
          aria-label="設定"
        >
          ⚙
        </button>
      </header>

      {records.length === 0 ? (
        <EmptyStateOnboarding onStart={() => setQuickRecordOpen(true)} />
      ) : (
        <PredictionBanner prediction={prediction} />
      )}

      <CalendarView
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        recordByDate={recordByDate}
        predictedDates={prediction.predictedDates}
        onSelectDay={setSelectedDate}
      />

      <button type="button" className={styles.fab} onClick={() => setQuickRecordOpen(true)}>
        + {recordLabel}
      </button>

      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setQuickRecordOpen(false)}
        onSave={recordDay}
        label={recordLabel}
      />

      <DayDetail
        key={selectedDate}
        date={selectedDate}
        record={selectedDate ? recordByDate.get(selectedDate) : null}
        dayOfPeriod={selectedDate ? getDayOfPeriod(records, selectedDate) : null}
        onClose={() => setSelectedDate(null)}
        onSave={recordDay}
        onDelete={removeRecord}
        label={recordLabel}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onResetAllData={resetAllData}
      />
    </div>
  )
}
