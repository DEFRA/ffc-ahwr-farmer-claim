jest.mock('../../../../app/event/raise-event')
const raiseEvent = require('../../../../app/event/raise-event')

const sendSessionEvent = require('../../../../app/event/send-session-event')

let organisation
let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const entryKey = 'organisation'
const key = 'test'
const value = 'test value'

describe('Send event on session set', () => {
  beforeEach(async () => {
    organisation = {
      sbi: '123456789',
      email: 'email@email.com',
      cph: '123/456/789'
    }

    event = {
      name: 'send-session-event',
      type: `${entryKey}-${key}`,
      message: `Session set for ${entryKey} and ${key}.`
    }
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await sendSessionEvent(organisation, sessionId, entryKey, key, value)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', async () => {
    event = {
      ...event,
      sbi: organisation.sbi,
      email: organisation.email,
      cph: organisation.cph,
      id: sessionId,
      data: { [key]: value }
    }

    await sendSessionEvent(organisation, sessionId, entryKey, key, value)
    expect(raiseEvent).toHaveBeenCalledWith(event)
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await sendSessionEvent(organisation, null, entryKey, key, value)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null organisation is received', async () => {
    await sendSessionEvent(null, sessionId, entryKey, key, value)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
