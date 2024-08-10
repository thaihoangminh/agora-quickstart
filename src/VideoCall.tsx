import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Camera, CameraOff, Mic, MicOff, Phone } from 'lucide-react'

import { useJoin, FetchArgs, useRemoteUsers, useRemoteAudioTracks, useRemoteVideoTracks } from 'agora-rtc-react'

import { appConfig } from '@/utils/const.ts'
import { Room } from '@/Room.tsx'
import { RenderRemoteUsers } from '@/RemoteUsers.tsx'

const rtcProps: FetchArgs = {
  appid: appConfig.appId,
  channel: appConfig.channel,
  token: appConfig.token,
}

type VideoCallProps = {
  calling: boolean
  setCalling: React.Dispatch<React.SetStateAction<boolean>>
}

function VideoCall({ calling, setCalling }: VideoCallProps) {
  // const [calling, setCalling] = useState(false)

  useJoin(rtcProps, calling)

  const [micOn, setMic] = useState(false)
  const [cameraOn, setCamera] = useState(false)

  const remoteUsers = useRemoteUsers()
  const { audioTracks } = useRemoteAudioTracks(remoteUsers)
  const { videoTracks } = useRemoteVideoTracks(remoteUsers)

  // play the remote user audio tracks
  audioTracks.forEach(track => track.play())

  return (
    <div>
      <Button size="icon" onClick={() => setMic(!micOn)}>
        {micOn ? <Mic size={16} /> : <MicOff color="#c83737" size={16} />}
      </Button>
      <Button size="icon" onClick={() => setCamera(!cameraOn)}>
        {cameraOn ? <Camera size={16} /> : <CameraOff color="#c83737" size={16} />}
      </Button>
      <Button
        className={`${!calling ? 'bg-green-500' : 'bg-red-500'}`}
        size="icon"
        onClick={() => setCalling(!calling)}
      >
        <Phone size={16} />
      </Button>
      {calling ? (
        <Room
          cameraOn={cameraOn}
          micOn={micOn}
          renderRemoteUsers={() => (
            <div className="b-1 b-solid b-coolgray-6 rd of-hidden relative w-[288px] h-[216px]">
              <RenderRemoteUsers videoTracks={videoTracks} />
            </div>
          )}
        />
      ) : (
        <div>Hello</div>
      )}
    </div>
  )
}

export default VideoCall
