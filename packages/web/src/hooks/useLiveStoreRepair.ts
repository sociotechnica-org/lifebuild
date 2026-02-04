import { useCallback, useEffect, useMemo, useState } from 'react'

const REPAIR_KEY_PREFIX = 'livestore:repair'
const REPAIR_SUGGEST_KEY_PREFIX = 'livestore:repair:suggest'
const REPAIR_CHANNEL_NAME = 'livestore-repair'

const REPAIR_REQUEST_MAX_AGE_MS = 24 * 60 * 60 * 1000
const REPAIR_ATTEMPT_MAX_AGE_MS = 10 * 60 * 1000
const REPAIR_SUGGESTION_MAX_AGE_MS = 30 * 60 * 1000

export type LiveStoreRepairState = {
  storeId: string
  status: 'requested' | 'attempted'
  requestedAt: number
  attemptedAt?: number
  reason: string
  source: string
  attemptId: string
  requestedBy: string
}

export type LiveStoreRepairSuggestion = {
  storeId: string
  suggestedAt: number
  reason: string
}

const getRepairKey = (storeId: string) => `${REPAIR_KEY_PREFIX}:${storeId}`
const getSuggestionKey = (storeId: string) => `${REPAIR_SUGGEST_KEY_PREFIX}:${storeId}`

const safeParse = <T>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const readRepairStateSync = (storeId: string): LiveStoreRepairState | null => {
  if (typeof window === 'undefined') return null
  const key = getRepairKey(storeId)
  const parsed = safeParse<LiveStoreRepairState>(window.localStorage.getItem(key))
  if (!parsed) return null

  const now = Date.now()
  if (parsed.status === 'requested' && now - parsed.requestedAt > REPAIR_REQUEST_MAX_AGE_MS) {
    window.localStorage.removeItem(key)
    return null
  }

  if (
    parsed.status === 'attempted' &&
    (!parsed.attemptedAt || now - parsed.attemptedAt > REPAIR_ATTEMPT_MAX_AGE_MS)
  ) {
    window.localStorage.removeItem(key)
    return null
  }

  return parsed
}

export const peekRepairRequestSync = (storeId: string): LiveStoreRepairState | null =>
  readRepairStateSync(storeId)

const readRepairSuggestionSync = (storeId: string): LiveStoreRepairSuggestion | null => {
  if (typeof window === 'undefined') return null
  const key = getSuggestionKey(storeId)
  const parsed = safeParse<LiveStoreRepairSuggestion>(window.localStorage.getItem(key))
  if (!parsed) return null

  const now = Date.now()
  if (now - parsed.suggestedAt > REPAIR_SUGGESTION_MAX_AGE_MS) {
    window.localStorage.removeItem(key)
    return null
  }

  return parsed
}

const writeRepairStateSync = (storeId: string, value: LiveStoreRepairState) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getRepairKey(storeId), JSON.stringify(value))
}

const writeRepairSuggestionSync = (storeId: string, value: LiveStoreRepairSuggestion) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getSuggestionKey(storeId), JSON.stringify(value))
}

const removeRepairStateSync = (storeId: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getRepairKey(storeId))
}

const removeRepairSuggestionSync = (storeId: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getSuggestionKey(storeId))
}

const getRepairSessionId = () => {
  if (typeof window === 'undefined') return 'server'

  const existing = window.sessionStorage.getItem('livestore:repair:session-id')
  if (existing) return existing

  const created = crypto.randomUUID()
  window.sessionStorage.setItem('livestore:repair:session-id', created)
  return created
}

export const consumeRepairRequestSync = (storeId: string): LiveStoreRepairState | null => {
  const current = readRepairStateSync(storeId)
  if (!current || current.status !== 'requested') return null

  const attempted: LiveStoreRepairState = {
    ...current,
    status: 'attempted',
    attemptedAt: Date.now(),
  }

  writeRepairStateSync(storeId, attempted)
  return attempted
}

export const useLiveStoreRepair = ({ storeId }: { storeId: string }) => {
  const [repairState, setRepairState] = useState<LiveStoreRepairState | null>(() =>
    readRepairStateSync(storeId)
  )
  const [repairSuggestion, setRepairSuggestion] = useState<LiveStoreRepairSuggestion | null>(() =>
    readRepairSuggestionSync(storeId)
  )

  const refresh = useCallback(() => {
    setRepairState(readRepairStateSync(storeId))
    setRepairSuggestion(readRepairSuggestionSync(storeId))
  }, [storeId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getRepairKey(storeId) || event.key === getSuggestionKey(storeId)) {
        refresh()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [refresh, storeId])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(REPAIR_CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<{ storeId?: string }>) => {
      if (!event.data || event.data.storeId !== storeId) return
      refresh()
    }

    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [refresh, storeId])

  const broadcast = useCallback(
    (payload: Record<string, unknown>) => {
      if (typeof BroadcastChannel === 'undefined') return
      const channel = new BroadcastChannel(REPAIR_CHANNEL_NAME)
      channel.postMessage({ storeId, ...payload })
      channel.close()
    },
    [storeId]
  )

  const requestRepair = useCallback(
    ({ reason, source }: { reason: string; source: string }) => {
      const state: LiveStoreRepairState = {
        storeId,
        status: 'requested',
        requestedAt: Date.now(),
        reason,
        source,
        attemptId: crypto.randomUUID(),
        requestedBy: getRepairSessionId(),
      }

      writeRepairStateSync(storeId, state)
      refresh()
      broadcast({ type: 'repair-requested' })
      return state
    },
    [broadcast, refresh, storeId]
  )

  const clearRepairState = useCallback(() => {
    removeRepairStateSync(storeId)
    refresh()
    broadcast({ type: 'repair-cleared' })
  }, [broadcast, refresh, storeId])

  const suggestRepair = useCallback(
    (reason: string) => {
      if (readRepairSuggestionSync(storeId)) {
        return
      }

      const suggestion: LiveStoreRepairSuggestion = {
        storeId,
        suggestedAt: Date.now(),
        reason,
      }

      writeRepairSuggestionSync(storeId, suggestion)
      refresh()
      broadcast({ type: 'repair-suggested' })
    },
    [broadcast, refresh, storeId]
  )

  const clearRepairSuggestion = useCallback(() => {
    removeRepairSuggestionSync(storeId)
    refresh()
    broadcast({ type: 'repair-suggestion-cleared' })
  }, [broadcast, refresh, storeId])

  return useMemo(
    () => ({
      repairState,
      repairSuggestion,
      requestRepair,
      clearRepairState,
      suggestRepair,
      clearRepairSuggestion,
      refresh,
    }),
    [
      repairState,
      repairSuggestion,
      requestRepair,
      clearRepairState,
      suggestRepair,
      clearRepairSuggestion,
      refresh,
    ]
  )
}
