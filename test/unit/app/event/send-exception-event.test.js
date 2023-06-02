jest.mock('../../../../app/event/raise-event')
const raiseEvent = require('../../../../app/event/raise-event')

const sendExceptionEvent = require('../../../../app/event/send-exception-event')

let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const sbi = '123'
const crn = 123
const exception = 'test exception'

describe('Send event on exception', () => {
  const MOCK_NOW = new Date()
  jest.useFakeTimers('modern')
  jest.setSystemTime(MOCK_NOW)

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await sendExceptionEvent(sessionId, sbi, crn, exception)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', async () => {
    event = {
      id: sessionId,
      sbi,
      cph: 'n/a',
      email: 'unknown',
      name: 'send-exception-event',
      type: 'exception-event',
      message: `Apply: ${exception}`,
      data: {
        sbi,
        crn,
        exception,
        raisedAt: MOCK_NOW,
        journey: 'apply'
      },
      status: 'alert'
    }

    await sendExceptionEvent(sessionId, sbi, crn, exception)
    expect(raiseEvent).toHaveBeenCalledWith(event, 'alert')
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await sendExceptionEvent(null, sbi, crn, exception)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null exception is received', async () => {
    await sendExceptionEvent(sessionId, sbi, crn, null)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
