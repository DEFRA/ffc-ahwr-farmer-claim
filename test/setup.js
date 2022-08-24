beforeEach(async () => {
  // Set reference to server in order to close the server during teardown.
  const createServer = require('../app/server')
  jest.useFakeTimers()
  const server = await createServer()
  await server.initialize()
  global.__SERVER__ = server
})
