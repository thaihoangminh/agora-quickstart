import AgoraRTM from 'agora-rtm-sdk'
import {
  addDiv,
  removeDiv,
  addWiggleAnimation,
  addMorphAnimation,
  addFade,
  addJoinButton,
  removeJoinButton,
  emptyContainer,
} from './ui'

// Config set up
const appId = import.meta.env.VITE_AGORA_APP_ID

// Extended RTM Settings
const rtmConfig = {
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

// Wait for page to load, then join Agora RTM
document.addEventListener('DOMContentLoaded', async () => {
  // Generate a unique ID
  const userId = await generateUniqueId()
  // get a token
  rtmConfig.token = await getToken(userId)
  // create client
  const client = new AgoraRTM.RTM(appId, userId, rtmConfig)

  // add event listeners
  // - NOTE: only add 1 set of listeners total.
  //   these will trigger based on events from all channels joined.
  addAgoraSignalingEventListeners(client)

  // Login to Agora
  try {
    const loginTimestamp = await client.login()
    console.log(`Signaling login success @ ${JSON.stringify(loginTimestamp)}`)
  } catch (error) {
    console.log(`Signaling Error: ${error}`)
  }

  // Set the name for the channel to subscribe to
  const channelName = 'test'

  // Add the join button and listener
  addJoin(client, channelName)

  // add click event listenter
  document.body.addEventListener('click', event => {
    // get a reference to the div that was clicked
    const div = event.target
    // fade the div locally, & send a message using RTM
    addFade(div, 6000)
    // create a string message that can be parsed by receiever
    const message = JSON.stringify({
      userEvent: 'click',
      target: div.id,
    })
    // Send the message into the chanel
    client.publish(channelName, message)
  })

  document.body.addEventListener('keydown', event => {
    // space bar event
    if (event.code == 'Space') {
      // fade the div locally, & send a message using RTM
      addFade(event.target, 2000) // target is the window - fades all divs
      // create a string message to send
      const message = JSON.stringify({
        userEvent: 'Space',
      })
      // Send the message into the chanel
      client.publish(channelName, message)
    }

    // Leave the channel on esc
    if (event.code == 'Escape') {
      leave(client, channelName)
    }
  })
})

// add the <button /> and subscribe logic
const addJoin = async (client, channelName) => {
  const joinBtn = await addJoinButton()
  joinBtn.addEventListener('click', async event => {
    // prevent the click from "bubbling up"
    event.stopPropagation()

    try {
      // set which types of messages you want to subscribe to
      const subscribeOptions = {
        withMessage: true,
        withPresence: true,
        withMetadata: false,
        withLock: false,
      }
      await client.subscribe(channelName, subscribeOptions)
      // once user joins the 'presence' event will be triggered
      removeJoinButton() // remove the join button
    } catch (error) {
      console.warn(error)
    }
  })
}

// handle leaving the channel and cleaning up the ui
const leave = async (client, channelName) => {
  client.unsubscribe(channelName) // unsubcribe from the channel
  await emptyContainer() // clear the container div contents
  addJoin(client, channelName) // add the join button
}

// Add Event Listeners
const addAgoraSignalingEventListeners = client => {
  // message events
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
  // storage events
  client.addEventListener('storage', eventArgs => {
    console.log(`storage event:`)
    console.log(eventArgs)
  })
  // topic events
  client.addEventListener('topic', eventArgs => {
    console.log(`topic event:`)
    console.log(eventArgs)
  })
  // lock events
  client.addEventListener('lock', eventArgs => {
    console.log(`lock event:`)
    console.log(eventArgs)
  })
  // token expire event
  client.addEventListener('TokenPriviledgeWillExpire', eventArgs => {
    console.log(`Token Priviledge Will Expire event:`)
    console.log(eventArgs)
    renewToken(client, channelName) // fetch and renew token
  })
}

const handlePresenceEvent = eventArgs => {
  const { eventType, publisher, stateChanged, snapshot: userList } = eventArgs
  // First time local user joins - SNAPSHOT event with empty publisher
  if (eventType == 'SNAPSHOT' && publisher == '') {
    // Add div for each user in the list.
    // - NOTE: this list includes the local user
    for (const userIndex in userList) {
      const user = userList[userIndex]
      addDiv(user.userId)
    }
  } else if (eventType == 'REMOTE_JOIN') {
    addDiv(publisher)
  } else if (eventType === 'REMOTE_LEAVE') {
    removeDiv(publisher)
  }
}

// parse the message event and apply animation
const handleMessageEvent = eventArgs => {
  const { messageType, publisher, message: messagePayload, publishTime } = eventArgs
  if (messageType === 'STRING') {
    const msg = JSON.parse(messagePayload)
    const userEvent = msg.userEvent
    if (userEvent === 'click') {
      const div = document.getElementById(msg.target)
      addWiggleAnimation(div)
    } else if (userEvent === 'Space') {
      const div = document.getElementById(publisher)
      addMorphAnimation(div)
    }
  }
}

// Generate unique ID
const generateUniqueId = async () => {
  const detailData = JSON.stringify(getDeviceInfo()) + getCanvasDetail()
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(detailData))
  const haseBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)))
  return haseBase64.replace(/\+/g, '_').replace(/\//g, '-').replace(/=+$/, '') // remove special characters
}

const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}X${screen.height}`,
    timzone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hasTouchScreen: navigator.maxTouchPoints > 0,
  }
}

const getCanvasDetail = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'alphabetic'
  ctx.font = "14px 'Arel'"
  ctx.fillStyle = '#f60'
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = '#069'
  ctx.fillText('Agora', 2, 15)
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7'
  ctx.fillText('Agora', 4, 17)
  return canvas.toDataURL()
}

// Fetch a token from the token server
const getToken = async (uid, expiration = 3600) => {
  // Token-Server using: AgoraIO-Community/agora-token-service
  const tokenServerURL = import.meta.env.VITE_AGORA_TOKEN_SERVER_URL + 'getToken'
  const tokenRequest = {
    tokenType: 'rtm',
    uid: uid,
    // "channel": channelName, // optional: passing channel gives streamchannel. wildcard "*" is an option.
    expire: expiration, // optional: expiration time in seconds (default: 3600)
  }

  try {
    const tokenFetchResposne = await fetch(tokenServerURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    })
    const data = await tokenFetchResposne.json()
    return data.token
  } catch (error) {
    console.log(`fetch error: ${error}`)
  }
}

// fetch a new token and update the client
const renewToken = async (client, channelName) => {
  const newToken = await getToken(userId, channelName)
  client.renewToken(newToken, { channelName: channelName })
}
