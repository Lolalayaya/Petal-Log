import { useState } from 'react'
import { usePeriodData } from './hooks/usePeriodData'
import { useCloudSync } from './hooks/useCloudSync'
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
import logoIcon from './assets/logo.svg'
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
    refreshFromStorage,
  } = usePeriodData()

  const cloudSync = useCloudSync(refreshFromStorage)

  const handleResetAllData = () => (cloudSync.status.enabled ? cloudSync.resetEverything() : resetAllData())

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isQuickRecordOpen, setQuickRecordOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isReportOpen, setReportOpen] = useState(false)
  const [gapWarning, setGapWarning] = useState(null)

  const handleRecordDay = (date, flow, symptoms, symptomNote) => {
    const result = recordDay(date, flow, symptoms, symptomNote)
    if (result?.shortGapWarning) {
      setGapWarning(`這次記錄的經期起始日與上次只間隔 ${result.gapDays} 天，一般生理上不太可能這麼快又來一次，已記錄這一天，但沒有自動產生後續天數的估算，請檢查是否記錯日期。`)
    } else {
      setGapWarning(null)
    }
  }

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
        <div className={styles.brand}>
          <img src={logoIcon} alt="" className={styles.logoIcon} />
          <h1 className={styles.logo}>Petal Log</h1>
        </div>
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

      {gapWarning && (
        <div className={styles.gapWarningBanner} role="status">
          <p className={styles.gapWarningText}>{gapWarning}</p>
          <button
            type="button"
            className={styles.gapWarningDismiss}
            onClick={() => setGapWarning(null)}
            aria-label="關閉提示"
          >
            ×
          </button>
        </div>
      )}

      <CalendarView
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        recordByDate={recordByDate}
        predictedDates={prediction.predictedDates}
        fertileWindowDates={settings.showOvulationPrediction ? prediction.fertileWindowDates : []}
        ovulationDate={settings.showOvulationPrediction ? prediction.ovulationDate : null}
        menstrualPhaseDates={settings.showOvulationPrediction && settings.showMenstrualPhase ? prediction.menstrualPhaseDates : []}
        follicularPhaseDates={settings.showOvulationPrediction && settings.showFollicularPhase ? prediction.follicularPhaseDates : []}
        ovulationPhaseDates={settings.showOvulationPrediction && settings.showOvulationPhase ? prediction.ovulationPhaseDates : []}
        lutealPhaseDates={settings.showOvulationPrediction && settings.showLutealPhase ? prediction.lutealPhaseDates : []}
        phaseColors={settings.phaseColors}
        onSelectDay={setSelectedDate}
      />

      <button type="button" className={styles.fab} onClick={() => setQuickRecordOpen(true)}>
        + 記錄
      </button>

      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setQuickRecordOpen(false)}
        onSave={handleRecordDay}
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
        onSave={handleRecordDay}
        onDelete={removeRecord}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onResetAllData={handleResetAllData}
        onOpenReport={() => setReportOpen(true)}
        cloudSync={cloudSync}
      />
    </div>
  )
}
