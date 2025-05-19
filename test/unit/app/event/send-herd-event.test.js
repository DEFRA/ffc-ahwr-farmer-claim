import { sendHerdEvent } from '../../../../app/event/send-herd-event'
import { raiseEvent } from '../../../../app/event/raise-event'

jest.mock('../../../../app/session', () => ({
  getEndemicsClaim: jest.fn().mockImplementation(() => { return { organisation: { sbi: 111222333, email: 'test@email.com' }, reference: 'IAHW-1234-5678' } })
}))
jest.mock('../../../../app/event/raise-event')

describe('sendHerdEvent', () => {
  const request = {
    headers: {
      'x-forwarded-for': '192:333:222,something'
    },
    yar: {
      id: '111222AAADDD'
    }
  }
  test('raise event is called with the event data', () => {
    sendHerdEvent({ request, type: 'herd-name', message: 'User entered a herd name', data: { someData: 'herd name' } })

    expect(raiseEvent).toHaveBeenCalledWith({
      cph: 'n/a',
      data: { someData: 'herd name' },
      email: 'test@email.com',
      id: '111222AAADDD',
      ip: '192:333:222',
      message: 'User entered a herd name',
      name: 'send-session-event',
      reference: 'IAHW-1234-5678',
      sbi: 111222333,
      type: 'herd-name'
    })
  })
})
