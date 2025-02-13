import { setup } from './insights.js'
import { createServer } from './server.js'
import { closeAllConnections as closeSenders } from './messaging/create-message-sender.js'
import { closeAllConnections as closeReceivers } from './messaging/create-message-receiver.js'

let server

const init = async () => {
  setup()
  server = await createServer()
  await server.start()
}

process.on('unhandledRejection', async (err) => {
  await server.stop()
  server.logger.error(err, 'unhandledRejection')
  await cleanup()
  process.exit(1)
})

process.on('SIGINT', async () => {
  await server.stop()
  await cleanup()
  process.exit(0)
})

async function cleanup () {
  await closeSenders()
  await closeReceivers()
}

init()
