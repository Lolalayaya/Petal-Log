import { useState } from 'react'
import { usePeriodData } from './hooks/usePeriodData'
import { CalendarView } from './components/CalendarView/CalendarView'
import { PredictionBanner } from './components/PredictionBanner/PredictionBanner'
import { QuickRecordModal } from './components/QuickRecordModal/QuickRecordModal'
import { DayDetail } from './components/DayDetail/DayDetail'
import { EmptyStateOnboarding } from './components/EmptyStateOnboarding/EmptyStateOnboarding'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { OnboardingFlow } from './components/OnboardingFlow/OnboardingFlow'
import { AnomalyBanner } from './components/AnomalyBanner/AnomalyBanner'
import { ReportView } from './components/ReportView/ReportView'
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
  const [isReportOpen, setReportOpen] = useState(false)

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

  if (isReportOpen) {
    return (
      <ReportView
        records={records}
        prediction={prediction}
        settings={settings}
        onClose={() => setReportOpen(false)}
      />
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
        <>
          <PredictionBanner prediction={prediction} showOvulationPrediction={settings.showOvulationPrediction} />
          {settings.showAnomalyAlerts && (
            <AnomalyBanner prediction={prediction} onViewReport={() => setReportOpen(true)} />
          )}
        </>
      )}

      <CalendarView
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        recordByDate={recordByDate}
        predictedDates={prediction.predictedDates}
        fertileWindowDates={settings.showOvulationPrediction ? prediction.fertileWindowDates : []}
        ovulationDate={settings.showOvulationPrediction ? prediction.ovulationDate : null}
        menstrualPhaseDates={settings.showMenstrualPhase ? prediction.menstrualPhaseDates : []}
        follicularPhaseDates={settings.showFollicularPhase ? prediction.follicularPhaseDates : []}
        ovulationPhaseDates={settings.showOvulationPhase ? prediction.ovulationPhaseDates : []}
        lutealPhaseDates={settings.showLutealPhase ? prediction.lutealPhaseDates : []}
        phaseColors={settings.phaseColors}
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
        fertilityStatus={
          settings.showOvulationPrediction && selectedDate
            ? selectedDate === prediction.ovulationDate
              ? 'ovulation'
              : prediction.fertileWindowDates.includes(selectedDate)
                ? 'fertile'
                : null
            : null
        }
        showSymptomTracking={settings.showSymptomTracking}
        customSymptoms={settings.customSymptoms}
        symptomColors={settings.symptomColors}
        hiddenSymptoms={settings.hiddenSymptoms}
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
        onOpenReport={() => setReportOpen(true)}
      />
    </div>
  )
}
