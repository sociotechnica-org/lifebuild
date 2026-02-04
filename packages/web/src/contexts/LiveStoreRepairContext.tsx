import { createContext, useContext } from 'react'
import type {
  LiveStoreRepairState,
  LiveStoreRepairSuggestion,
} from '../hooks/useLiveStoreRepair.js'

export type LiveStoreRepairContextValue = {
  storeId: string
  requestRepair: (reason: string, source: string) => void
  repairState: LiveStoreRepairState | null
  repairSuggestion: LiveStoreRepairSuggestion | null
  clearRepairSuggestion: () => void
  suggestRepair: (reason: string) => void
}

const defaultContext: LiveStoreRepairContextValue = {
  storeId: 'unknown',
  requestRepair: () => undefined,
  repairState: null,
  repairSuggestion: null,
  clearRepairSuggestion: () => undefined,
  suggestRepair: () => undefined,
}

const LiveStoreRepairContext = createContext<LiveStoreRepairContextValue>(defaultContext)

export const LiveStoreRepairProvider = LiveStoreRepairContext.Provider

export const useLiveStoreRepairContext = () => useContext(LiveStoreRepairContext)
