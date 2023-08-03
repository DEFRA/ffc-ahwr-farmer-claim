require('./insights').setup()
const createServer = require('./server')
const MessageSenders = require('./messaging/create-message-sender')
const MessageReceivers = require('./messaging/create-message-receiver')

let server

createServer()
  .then(_server => {
    server = _server
    server.start()
  })
  .catch(err => {
    console.error(err)
    cleanup()
    process.exit(1)
  })

process.on('SIGINT', () => {
  server.stop()
    .then(() => {
      cleanup()
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      cleanup()
      process.exit(1)
    })
})

function cleanup () {
  MessageSenders.closeAllConnections()
  MessageReceivers.closeAllConnections()
}
