import { ReactNode } from 'react'

import AgoraRTC, { AgoraRTCProvider, ClientConfig, useRTCClient } from 'agora-rtc-react'

const config: ClientConfig = {
  mode: 'rtc',
  codec: 'vp8',
}

export const AgoraProvider = ({ children }: { children: ReactNode }) => {
  const agoraClient = useRTCClient(AgoraRTC.createClient(config))

  return <AgoraRTCProvider client={agoraClient}>{children}</AgoraRTCProvider>
}
