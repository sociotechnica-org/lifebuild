const envRoomChatFlag =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_ROOM_CHAT === 'true'

export const ROOM_CHAT_OVERRIDE_STORAGE_KEY = 'room-chat:override'
const ROOM_CHAT_QUERY_PARAM = 'roomChat'

const parseBoolean = (value: string | null): boolean | null => {
  if (value === null) return null
  const normalized = value.toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

const readRoomChatOverride = (): boolean | null => {
  if (typeof window === 'undefined') return null

  try {
    const params = new URLSearchParams(window.location.search)
    const queryOverride = parseBoolean(params.get(ROOM_CHAT_QUERY_PARAM))
    if (queryOverride !== null) return queryOverride

    const storedValue = window.localStorage.getItem(ROOM_CHAT_OVERRIDE_STORAGE_KEY)
    return parseBoolean(storedValue)
  } catch {
    return null
  }
}

export const isRoomChatEnabled = envRoomChatFlag

export const shouldEnableRoomChat = () => {
  const override = readRoomChatOverride()
  if (override !== null) return override
  return envRoomChatFlag
}
