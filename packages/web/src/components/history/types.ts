export interface HistoryEvent {
  id: string
  type: string
  timestamp: Date
  data: Record<string, unknown>
  actorId?: string // Who performed this action
}
