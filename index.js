require('dotenv').config()

// patch nodejs for RongIMLib
global.window = global
var ws = require('ws')
global.WebSocket = ws
global.location = {
  protocol: 'https:',
}
global.document = {
  documentElement: {},
}
global.navigator = {
  userAgent: '',
}
global.ActiveXObject = () => {
  return {}
}
var wrtc = require('wrtc')
Object.assign(global, wrtc)

var RongIMLib = require('./RongIMLib')
var RongIMClient = RongIMLib.RongIMClient
var wsServer = new ws.Server({
  host: process.env.host,
  port: parseInt(process.env.port),
})

var server = require('./server')

wsServer.on('connection', (socket) => {
  socket.on('message', clientHandler)
})

RongIMClient.setOnReceiveMessageListener({
  onReceived: (...args) => {
    var data = JSON.stringify({
      cmd: 'receiveMessage',
      args: args,
    })
    wsServer.clients.forEach((e) => {
      e.send(data, () => {})
    })
  },
})

function clientHandler(data) {
  try {
    var packet = JSON.parse(data)
  } catch (error) {
    console.log(error)
    return
  }

  switch (packet.cmd) {
    case 'sendGroupMessage':
      server
        .sendMessage(
          3,
          packet.channelId,
          new RongIMLib.TextMessage({
            messageName: 'TextMessage',
            content: packet.content,
            extra: JSON.stringify({
              type: '3',
              mention: [],
              mention_all: false,
              mention_roles: [],
              mention_here: false,
              author: {
                nickname: server.user.username,
                username: server.user.username,
                identify_num: server.user.identify_num,
                avatar: server.user.avatar,
                id: server.user.id,
              },
            }),
          })
        )
        .then((e) => {})
        .catch(console.error)
      break
    case 'sendGroupImage':
      server
        .sendMessage(
          3,
          packet.channelId,
          new RongIMLib.ImageMessage({
            messageName: 'ImageMessage',
            content: packet.content,
            imageUri: packet.content,
            extra: JSON.stringify({
              type: '2',
              code: '',
              image_name: packet.image_name,
              mention: [],
              mention_all: false,
              mention_roles: [],
              mention_here: false,
              author: {
                nickname: server.user.username,
                username: server.user.username,
                identify_num: server.user.identify_num,
                avatar: server.user.avatar,
                id: server.user.id,
              },
            }),
          })
        )
        .then((e) => {})
        .catch(console.error)
      break
  }
}

server.connect()
