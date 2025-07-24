export interface HistoryEvent {
  id: string
  type: string
  timestamp: Date
  data: Record<string, unknown>
}
