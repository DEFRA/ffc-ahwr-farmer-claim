import { createMessage } from '../../../../app/messaging/create-message.js'
import { createMessageSender } from '../../../../app/messaging/create-message-sender.js'
import { sendMessage } from '../../../../app/messaging/send-message.js'

jest.mock('../../../../app/messaging/create-message')
jest.mock('../../../../app/messaging/create-message-sender')

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a message and send it using the message sender', async () => {
    const body = 'Hello'
    const type = 'text'
    const options = { priority: 'high' }
    const config = { url: 'https://example.com', apiKey: '123456' }

    const message = { body, type, options }
    const sender = { sendMessage: jest.fn() }

    createMessage.mockReturnValueOnce(message)
    createMessageSender.mockReturnValueOnce(sender)

    await sendMessage(body, type, config, options)

    expect(createMessage).toHaveBeenCalledTimes(1)
    expect(createMessage).toHaveBeenCalledWith(body, type, options)

    expect(createMessageSender).toHaveBeenCalledTimes(1)
    expect(createMessageSender).toHaveBeenCalledWith(config)

    expect(sender.sendMessage).toHaveBeenCalledTimes(1)
    expect(sender.sendMessage).toHaveBeenCalledWith(message)
  })
})
