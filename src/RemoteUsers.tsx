import type { IRemoteVideoTrack } from 'agora-rtc-react'
import { RemoteVideoTrack } from 'agora-rtc-react'
import { fakeName } from '@/utils/fake.ts'
import { Label } from '@/Label.tsx'

export function RenderRemoteUsers({ videoTracks }: { videoTracks: IRemoteVideoTrack[] }) {
  console.log('videoTracks:', videoTracks)
  return (
    <div className="remote-video-tracks w-full h-full">
      {videoTracks.map((track: IRemoteVideoTrack) => (
        <div className="w-full h-full" key={track.getUserId()}>
          <RemoteVideoTrack play={true} track={track} />
          <Label>{`${fakeName(track.getUserId())}{${track.getUserId()}}`}</Label>
        </div>
      ))}
    </div>
  )
}
