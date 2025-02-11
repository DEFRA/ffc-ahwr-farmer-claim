import { createServer } from '../../../app/server.js'
import { closeAllConnections as closeSenderConnections } from '../../../app/messaging/create-message-sender.js'
import { closeAllConnections as closeReceiverConnections } from '../../../app/messaging/create-message-receiver.js'

jest.mock('../../../app/server', () => jest.fn().mockResolvedValue({
  initialize: jest.fn(),
  stop: jest.fn().mockResolvedValue()
}))

describe('Server', () => {
  let server
  let originalProcessOn
  let origianlProcessExit
  let originalConsoleError

  beforeAll(() => {
    originalProcessOn = process.on
    origianlProcessExit = process.exit
    originalConsoleError = console.error
    process.on = jest.fn()
    process.exit = jest.fn()
    console.error = jest.fn()
  })

  afterAll(() => {
    process.on = originalProcessOn
    process.exit = origianlProcessExit
    console.error = originalConsoleError
  })

  beforeEach(() => {
    jest.mock('../../../app/insights')
    jest.mock('../../../app/server', () => jest.fn().mockResolvedValue({
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue()
    }))
    jest.mock('../../../app/messaging/create-message-sender', () => ({
      closeAllConnections: jest.fn()
    }))
    jest.mock('../../../app/messaging/create-message-receiver', () => ({
      closeAllConnections: jest.fn()
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should stop the server and perform cleanup on SIGINT', async () => {
    server = {
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue()
    }
    createServer.mockResolvedValue(server)

    require('../../../app/index')

    await createServer()

    expect(createServer).toHaveBeenCalled()
    expect(server.start).toHaveBeenCalled()

    // Simulate SIGINT
    process.on.mock.calls[0][1]()

    await Promise.resolve() // Wait for pending promises to settle

    expect(server.stop).toHaveBeenCalled()
    expect(closeSenderConnections).toHaveBeenCalled()
    expect(closeReceiverConnections).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('should log and exit with error on stop the server failure', async () => {
    const error = new Error('Server stop failed')
    server = {
      start: jest.fn(),
      stop: jest.fn().mockRejectedValue(error)
    }
    createServer.mockResolvedValue(server)

    require('../../../app/index')

    await expect(createServer()).resolves.toEqual(expect.anything())

    expect(createServer).toHaveBeenCalled()
    expect(server.start).toHaveBeenCalled()

    // Simulate SIGINT
    process.on.mock.calls[0][1]()

    const waitForPendingPromisesToSettle = new Error('Wait for pending promises to settle')
    await expect(Promise.reject(waitForPendingPromisesToSettle)).rejects.toEqual(waitForPendingPromisesToSettle)

    expect(server.stop).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(error)
    expect(closeSenderConnections).toHaveBeenCalled()
    expect(closeReceiverConnections).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should log and exit with error on server start failure', async () => {
    const error = new Error('Server start failed')
    createServer.mockRejectedValue(error)

    require('../../../app/index')

    await expect(createServer()).rejects.toEqual(error)

    expect(createServer).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(error)
    expect(closeSenderConnections).toHaveBeenCalled()
    expect(closeReceiverConnections).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
