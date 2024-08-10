import { useState } from 'react'
import { Phone, Video } from 'lucide-react'
import AgoraRTM, { ChannelType, RTMClient, RTMConfig, RTMEvents, SubscribeOptions } from 'agora-rtm-sdk'

import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { getToken } from '@/utils/utils.ts'
import VideoCall from '@/VideoCall.tsx'

const APP_ID = import.meta.env.VITE_AGORA_APP_ID

// A default channel that is used for all users after logged-in
const COWIN_CHANNEL = 'cowin'

const rtmConfig: RTMConfig = {
  token: '',
  encryptionMode: '',
  cypherKey: '',
  salt: '',
  useStringUserId: true,
  presencetimeout: 300, // defualt
  logUpload: true,
  logLevel: '',
  cloudProxy: false,
}

const CUSTOM_EVENT_TYPE = {
  CALLING: 'calling',
  ACCEPT_CALL: 'accept_the_call',
}

function App() {
  const { toast } = useToast()
  const [channel, setChannel] = useState(COWIN_CHANNEL)
  const [userName, setUserName] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [remoteUser, setRemoteUser] = useState<string>('')
  const [comingCallData, setComingCallData] = useState<RTMEvents.MessageEvent | null>(null)

  const [calling, setCalling] = useState(false)

  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null)

  const handleTopicEvent = (eventArgs: RTMEvents.TopicEvent) => {
    console.log('topic event:', eventArgs)
  }

  const handlePresenceEvent = (eventArgs: RTMEvents.PresenceEvent) => {
    console.log('presence event:', eventArgs)
    if (eventArgs.eventType === 'SNAPSHOT') {
      const newUser = eventArgs.snapshot?.find(member => member.userId !== userName)
      if (newUser) {
        setRemoteUser(newUser.userId)
      }
    }

    if (eventArgs.eventType === 'REMOTE_JOIN') {
      setRemoteUser(eventArgs.publisher)
      toast({
        className: 'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4',
        title: 'User Joined',
        description: `${eventArgs.publisher} joined the channel`,
      })
    }
  }

  const handleMessageEvent = (eventArgs: RTMEvents.MessageEvent) => {
    if (eventArgs.customType === CUSTOM_EVENT_TYPE.CALLING) {
      setComingCallData(eventArgs)
    }

    // Accept the call from the caller
    if (eventArgs.customType === CUSTOM_EVENT_TYPE.ACCEPT_CALL) {
      setCalling(true)
      console.log(eventArgs.publisher, ' already accept the call from you')
    }
  }

  const setupSignalingEngine = async (rtmConfig: RTMConfig, userId: string) => {
    try {
      const client = new AgoraRTM.RTM(APP_ID, userId, rtmConfig)
      setRtmClient(client)

      client.addEventListener('message', eventArgs => {
        console.log(`message event:`)
        console.log(eventArgs)
        handleMessageEvent(eventArgs)
      })
      // status events
      client.addEventListener('status', eventArgs => {
        console.log(`status event:`)
        console.log(eventArgs)
      })
      // presence events
      client.addEventListener('presence', eventArgs => {
        console.log(`presence event:`)
        console.log(eventArgs)
        handlePresenceEvent(eventArgs)
      })

      // topic events
      client.addEventListener('topic', eventArgs => {
        console.log(`topic event:`)
        console.log(eventArgs)
        handleTopicEvent(eventArgs)
      })

      return client
    } catch (error) {
      console.log(`SetupSignalingEngine Error: ${error}`)
      toast({
        className: 'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4',
        title: 'Error',
        description: 'An error occurred while setting up the signaling engine',
      })
    }
  }

  const login = async () => {
    setIsLogin(true)
    try {
      const token = await getToken(userName)

      const newRtmConfig: RTMConfig = {
        ...rtmConfig,
        token,
      }
      const client = await setupSignalingEngine(newRtmConfig, userName)
      if (!client) return

      const loginResponse = await client?.login()
      if (!loginResponse) return

      setIsLoggedIn(true)
    } catch (error) {
      console.log(`Login Error: ${error}`)
    } finally {
      setIsLogin(false)
    }
  }

  const logout = async () => {
    try {
      await rtmClient?.logout()
      setIsLoggedIn(false)
    } catch (error) {
      console.log(`Logout Error: ${error}`)
    }
  }

  const subscribeToChannel = async (channelName: string) => {
    try {
      const subscribeOptions: SubscribeOptions = {
        withMessage: true,
        withPresence: true,
        withMetadata: false,
        withLock: false,
      }
      await rtmClient?.subscribe(channelName, subscribeOptions)
      toast({
        className: 'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4',
        title: 'Channel Joined',
        description: `You joined the channel: ${channelName}`,
      })
    } catch (error) {
      console.warn(error)
    }
  }

  // Send a message to a channel
  const sendChannelMessage = async (
    channelName: string,
    message: string,
    options?: { customType?: string; channelType?: ChannelType },
  ) => {
    const payload = { type: 'text', message }
    const publishMessage = JSON.stringify(payload)
    try {
      const sendResult = await rtmClient?.publish(channelName, publishMessage, { ...options })
      console.log('sendResult:', sendResult)
      // messageCallback(`Message sent to channel ${channelName}: ${Message}`)
    } catch (error) {
      console.log('sendChannelMessage error', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Video Call App</h1>
      {!isLoggedIn && (
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Login with username</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Username"
              className="w-[200px] mb-2"
              value={userName}
              onChange={event => setUserName(event.target.value)}
            />
            <Button disabled={userName.length === 0 || isLogin} onClick={login}>
              {isLogin ? 'Logging...' : 'Submit'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoggedIn && (
        <>
          <div className="text-xl mb-2">
            Hello: {userName} <Button onClick={logout}>Logout</Button>
          </div>

          {!!comingCallData && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Coming Call</CardTitle>
                <CardDescription>
                  <span className="font-bold">{comingCallData.publisher}</span> is calling to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="mr-2"
                  onClick={() => {
                    setCalling(true)
                    setComingCallData(null)
                    sendChannelMessage(comingCallData?.channelName, 'Calling...', {
                      customType: CUSTOM_EVENT_TYPE.ACCEPT_CALL,
                    })
                  }}
                >
                  Accept
                </Button>
                <Button onClick={() => setComingCallData(null)} variant="destructive">
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Join a Channel</CardTitle>
              <CardDescription>Assumption the user will joined his/her own channel after logged-in</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Channel"
                className="w-[200px] mb-2"
                value={channel}
                onChange={event => setChannel(event.target.value)}
              />
              <Button onClick={() => subscribeToChannel(channel)}>Join</Button>
            </CardContent>
          </Card>
          {remoteUser && (
            <Card className="mb-4">
              <CardContent>
                <div className="my-2">
                  {remoteUser}{' '}
                  <Button
                    className="mr-2"
                    onClick={() =>
                      sendChannelMessage(remoteUser, 'Calling...', {
                        customType: CUSTOM_EVENT_TYPE.CALLING,
                      })
                    }
                  >
                    <Video size={16} />
                  </Button>
                  <Button>
                    <Phone size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {calling && (
            <Card>
              <CardContent>
                <VideoCall calling={calling} setCalling={setCalling} />
              </CardContent>
            </Card>
          )}
        </>
      )}
      <Toaster />
    </div>
  )
}

export default App
