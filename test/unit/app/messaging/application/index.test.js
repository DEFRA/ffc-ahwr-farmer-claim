import { sendMessage } from '../../../../../app/messaging/send-message.js'
import { receiveMessage } from '../../../../../app/messaging/receive-message.js'
import { getApplication } from '../../../../../app/messaging/application/index.js'
import { applicationRequestQueue, applicationResponseQueue, mqConfig } from '../../../../../app/config/messaging.js'

const { fetchApplicationRequestMsgType } = mqConfig

jest.mock('../../../../../app/messaging/receive-message.js')
jest.mock('../../../../../app/messaging/send-message.js')

describe('application messaging tests', () => {
  const sessionId = 'a-session-id'

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('getApplication sends and receives message', async () => {
    const reference = 'VV-1234-5678'
    const receiveMessageRes = { id: 1 }
    receiveMessage.mockResolvedValue(receiveMessageRes)

    const message = await getApplication(reference, sessionId)

    expect(message).toEqual(receiveMessageRes)
    expect(receiveMessage).toHaveBeenCalledTimes(1)
    expect(receiveMessage).toHaveBeenCalledWith(sessionId, applicationResponseQueue)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationReference: reference }, fetchApplicationRequestMsgType, applicationRequestQueue, { sessionId })
  })
})
