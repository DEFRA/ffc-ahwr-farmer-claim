const sendSessionEvent = require('../../../../app/event/send-session-event')

const raiseEvent = require('../../../../app/event/raise-event')
jest.mock('../../../../app/event/raise-event')

const claim = { organisation: {}, reference: 'AHWR-TEMP-IDE' }
let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const entryKey = 'entryKey'
let key = 'test'
const value = 'test value'
const ip = '1.1.1.1'

describe('Send event on session set', () => {
  beforeEach(async () => {
    claim.organisation = {
      sbi: '123456789',
      email: 'email@email.com',
      cph: '123/456/789'
    }
  
    event = {
      name: 'send-session-event',
      type: `${entryKey}-${key}`,
      message: `Session set for ${entryKey} and ${key}.`,
      reference: claim.reference,
      sbi: claim.organisation.sbi,
      email: claim.organisation.email,
      cph: 'n/a',
      id: sessionId,
      ip,
      data: { reference: claim.reference, [key]: value }
    }
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', async () => {
    await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).toHaveBeenCalledWith(event, 'success')
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await sendSessionEvent(claim, null, entryKey, key, value, ip)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null organisation is received', async () => {
    claim.organisation = null
    await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  describe('should call raiseEvent with renamed keys when identified', () => {
    test('renames laboratoryURN to urnResult', async () => {
      key = 'laboratoryURN'
      const expectedEvent = {
        ...event,
        type: `${entryKey}-urnResult`,
        data: { reference: claim.reference, urnResult: value },
        message: `Session set for ${entryKey} and urnResult.`
      }

      await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
      expect(raiseEvent).toHaveBeenCalledWith(expectedEvent, 'success')
    })

    test('renames vetsName to vetName', async () => {
      key = 'vetsName'
      const newValue = 'vetName'
      const expectedEvent = {
        ...event,
        type: `${entryKey}-${newValue}`,
        data: { reference: claim.reference, vetName: value },
        message: `Session set for ${entryKey} and ${newValue}.`
      }

      await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
      expect(raiseEvent).toHaveBeenCalledWith(expectedEvent, 'success')
    })

    test('renames vetRCVSNumber to vetRcvs', async () => {
      key = 'vetRCVSNumber'
      const newValue = 'vetRcvs'
      const expectedEvent = {
        ...event,
        type: `${entryKey}-${newValue}`,
        data: { reference: claim.reference, vetRcvs: value },
        message: `Session set for ${entryKey} and ${newValue}.`
      }

      await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
      expect(raiseEvent).toHaveBeenCalledWith(expectedEvent, 'success')
    })

    test('renames dateOfVisit to visitDate', async () => {
      key = 'dateOfVisit'
      const newValue = 'visitDate'
      const expectedEvent = {
        ...event,
        type: `${entryKey}-${newValue}`,
        data: { reference: claim.reference, visitDate: value },
        message: `Session set for ${entryKey} and ${newValue}.`
      }

      await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
      expect(raiseEvent).toHaveBeenCalledWith(expectedEvent, 'success')
    })

    test('renames numberAnimalsTested to animalsTested', async () => {
      key = 'numberAnimalsTested'
      const newValue = 'animalsTested'
      const expectedEvent = {
        ...event,
        type: `${entryKey}-${newValue}`,
        data: { reference: claim.reference, animalsTested: value },
        message: `Session set for ${entryKey} and ${newValue}.`
      }

      await sendSessionEvent(claim, sessionId, entryKey, key, value, ip)
      expect(raiseEvent).toHaveBeenCalledWith(expectedEvent, 'success')
    })
  })
})
