jest.mock('../../../../app/event/raise-event')
const raiseEvent = require('../../../../app/event/raise-event')

const sendMonitorindEvent = require('../../../../app/event/send-monitoring-event')

let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const email = 'test@test.com'
const status = 'alert'

describe('Send event on session set', () => {
  beforeEach(async () => {
    event = {
      sbi: 'n/a',
      cph: 'n/a',
      name: 'send-monitoring-event',
      type: 'monitoring-magic-link',
      message: 'Monitoring magic link.'
    }
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await sendMonitorindEvent(sessionId, 'monitoring test event raised.', email)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', async () => {
    event = {
      ...event,
      email,
      id: sessionId,
      data: { alert: 'monitoring test event raised.' }
    }

    await sendMonitorindEvent(sessionId, 'monitoring test event raised.', email)
    expect(raiseEvent).toHaveBeenCalledWith(event, status)
  })

  test('should call raiseEvent with event including sessionId and email unknow set', async () => {
    event = {
      ...event,
      email: 'unknown',
      id: sessionId,
      data: { alert: 'monitoring test event raised.' }
    }

    await sendMonitorindEvent(sessionId, 'monitoring test event raised.', null)
    expect(raiseEvent).toHaveBeenCalledWith(event, status)
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await sendMonitorindEvent(null, 'monitoring test event raised.', email)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
