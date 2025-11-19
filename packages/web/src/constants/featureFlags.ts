export const isRoomChatEnabled =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_ROOM_CHAT === 'true'
