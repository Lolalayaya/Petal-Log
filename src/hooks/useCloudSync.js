import { useCallback, useEffect, useState } from 'react'
import {
  subscribe,
  getSyncStatus,
  enableSyncNew as enableSyncNewInManager,
  enableSyncJoin as enableSyncJoinInManager,
  resolveJoin as resolveJoinInManager,
  revealCode,
  bindRecoveryEmail as bindRecoveryEmailInManager,
  disableSync as disableSyncInManager,
  resetEverything as resetEverythingInManager,
} from '../data/syncManager'

/** @param {() => void} [onSynced] 背景同步完成時呼叫，通常傳入 usePeriodData 的 refreshFromStorage */
export function useCloudSync(onSynced) {
  const [status, setStatus] = useState(() => getSyncStatus())

  useEffect(() => {
    return subscribe(() => {
      setStatus(getSyncStatus())
      onSynced?.()
    })
  }, [onSynced])

  const enableSyncNew = useCallback(async (themeName) => {
    const result = await enableSyncNewInManager(themeName)
    setStatus(getSyncStatus())
    return result
  }, [])

  const enableSyncJoin = useCallback(async (code) => {
    const result = await enableSyncJoinInManager(code)
    setStatus(getSyncStatus())
    return result
  }, [])

  const resolveJoin = useCallback(async (strategy) => {
    const result = await resolveJoinInManager(strategy)
    setStatus(getSyncStatus())
    return result
  }, [])

  const bindRecoveryEmail = useCallback(async (email) => {
    return bindRecoveryEmailInManager(email)
  }, [])

  const disableSync = useCallback(async () => {
    await disableSyncInManager()
    setStatus(getSyncStatus())
  }, [])

  const resetEverything = useCallback(async () => {
    await resetEverythingInManager()
    setStatus(getSyncStatus())
  }, [])

  return {
    status,
    enableSyncNew,
    enableSyncJoin,
    resolveJoin,
    revealCode,
    bindRecoveryEmail,
    disableSync,
    resetEverything,
  }
}
