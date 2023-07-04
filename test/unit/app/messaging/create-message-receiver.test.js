const { createMessageReceiver, cachedReceivers, closeAllConnections } = require('../../../../app/messaging/create-message-receiver')

const MOCK_CLOSE_CONNECTION = jest.fn()

jest.mock('ffc-messaging', () => {
  const MockMessageReceiver = jest.fn().mockImplementation(() => ({
    closeConnection: MOCK_CLOSE_CONNECTION
  }))

  return {
    MessageReceiver: MockMessageReceiver
  }
})

describe('closeAllConnections', () => {
  beforeEach(() => {
    // Clear the cachedSenders object before each test
    Object.keys(cachedReceivers).forEach((key) => delete cachedReceivers[key])
  })

  test('should close all connections and clear cachedSenders', async () => {
    createMessageReceiver({
      address: 'abc'
    })
    createMessageReceiver({
      address: 'abcd'
    })
    expect(Object.keys(cachedReceivers)).toHaveLength(2)
    createMessageReceiver({
      address: 'abcde'
    })
    expect(Object.keys(cachedReceivers)).toHaveLength(3)
    createMessageReceiver({
      address: 'abcde'
    })
    expect(Object.keys(cachedReceivers)).toHaveLength(3)

    await closeAllConnections()

    expect(MOCK_CLOSE_CONNECTION).toHaveBeenCalledTimes(3)
    expect(Object.keys(cachedReceivers)).toHaveLength(0)
  })

  test('should do nothing when cachedSenders is empty', async () => {
    // Call closeAllConnections when cachedSenders is empty
    await closeAllConnections()

    // Expect no errors to be thrown
    // Expect cachedSenders to remain empty
    expect(Object.keys(cachedReceivers)).toHaveLength(0)
  })
})
