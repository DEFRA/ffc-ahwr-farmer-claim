const { createMessageReceiver } = require('../../../../app/messaging/create-message-receiver')
const receiveMessage = require('../../../../app/messaging/receive-message')

jest.mock('../../../../app/messaging/create-message-receiver', () => ({
  createMessageReceiver: jest.fn()
}))

describe('receiveMessage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should receive and process a message', async () => {
    // Mocking the createMessageReceiver function
    const receiverMock = {
      sbClient: {
        acceptSession: jest.fn().mockResolvedValue({ /* mock sessionReceiver */ })
      }
    }
    createMessageReceiver.mockReturnValue(receiverMock)

    // Mocking the sessionReceiver object and its methods
    const sessionReceiverMock = {
      receiveMessages: jest.fn().mockResolvedValue([{ body: 'Test message' }]),
      completeMessage: jest.fn(),
      close: jest.fn()
    }
    receiverMock.sbClient.acceptSession.mockResolvedValue(sessionReceiverMock)

    // Calling the receiveMessage function
    const messageId = 'test-message-id'
    const config = { address: 'abc' }
    const result = await receiveMessage(messageId, config)

    // Assertions
    expect(result).toEqual('Test message')
    expect(createMessageReceiver).toHaveBeenCalledWith(config)
    expect(receiverMock.sbClient.acceptSession).toHaveBeenCalledWith('abc', messageId)
    expect(sessionReceiverMock.receiveMessages).toHaveBeenCalledWith(1, { maxWaitTimeInMs: 50000 })
    expect(sessionReceiverMock.completeMessage).toHaveBeenCalledWith({ body: 'Test message' })
    expect(sessionReceiverMock.close).toHaveBeenCalled()
  })
})
