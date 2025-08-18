import { setup } from './insights.js'
import { createServer } from './server.js'

let server

const init = async () => {
  const appInsightsInUse = setup()
  server = await createServer()
  await server.start()

  if (appInsightsInUse) {
    server.logger.info('Application Insights running')
  } else {
    server.logger.info('Application Insights is not running')
  }
}

process.on('unhandledRejection', async (err) => {
  await server.stop()
  server.logger.error(err, 'unhandledRejection')
  process.exit(1)
})

process.on('SIGINT', async () => {
  await server.stop()
  process.exit(0)
})

init()
