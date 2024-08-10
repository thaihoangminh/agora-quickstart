import type { UID } from 'agora-rtc-react'

const ShareScreenUID: UID = 10

export const appConfig = {
  appId: import.meta.env.VITE_AGORA_APP_ID,
  channel: import.meta.env.VITE_AGORA_CHANNEL || 'test',
  token: import.meta.env.VITE_AGORA_TOKEN ? import.meta.env.VITE_AGORA_TOKEN : null,
  ShareScreenUID,
}
