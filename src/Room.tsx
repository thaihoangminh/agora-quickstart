import { ReactNode, useMemo } from 'react'
import {
  LocalUser,
  useCurrentUID,
  useIsConnected,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from 'agora-rtc-react'
import { fakeAvatar, fakeName } from '@/utils/fake.ts'
import { UsersInfo } from '@/UsersInfo.tsx'
import { Label } from '@/Label.tsx'

type RoomProps = {
  renderAction?: () => ReactNode
  renderLocalUser?: () => ReactNode
  renderRemoteUsers?: () => ReactNode
  micOn: boolean
  cameraOn: boolean
  showUserInfo?: boolean
}

export const Room = ({
  micOn,
  cameraOn,
  renderAction,
  renderLocalUser,
  renderRemoteUsers,
  showUserInfo = true,
}: RoomProps) => {
  const isConnected = useIsConnected()
  const uid = useCurrentUID() || 0
  const userName = useMemo(() => fakeName(uid), [uid])
  const userAvatar = useMemo(() => fakeAvatar(), [])

  const remoteUsers = useRemoteUsers()
  const publishedUsers = remoteUsers.filter(user => user.hasAudio || user.hasVideo)
  const selfPublished = micOn || cameraOn

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack } = useLocalCameraTrack(cameraOn)
  usePublish([localMicrophoneTrack, localCameraTrack])

  return (
    <>
      {renderAction ? renderAction() : undefined}
      {showUserInfo && (
        <UsersInfo published={publishedUsers.length + (selfPublished ? 1 : 0)} total={remoteUsers.length + 1} />
      )}
      <div className="flex gap-2">
        {isConnected &&
          (renderLocalUser ? (
            renderLocalUser()
          ) : (
            <div className="relative w-[288px] h-[216px] overflow-hidden bg-black">
              <LocalUser
                audioTrack={localMicrophoneTrack}
                videoTrack={localCameraTrack}
                cameraOn={cameraOn}
                micOn={micOn}
                playAudio={micOn}
                playVideo={cameraOn}
                // cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
                cover={userAvatar}
              >
                {<Label>{`${userName}{${uid}}`}</Label>}
              </LocalUser>
            </div>
          ))}
        {renderRemoteUsers ? renderRemoteUsers() : undefined}
      </div>
    </>
  )
}
