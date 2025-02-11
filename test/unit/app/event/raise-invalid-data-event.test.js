import { raiseInvalidDataEvent } from '../../../../app/event/raise-invalid-data-event.js'
import { raiseEvent } from '../../../../app/event/raise-event.js'

const getEndemicsClaimMock = require('../../../../app/session').getEndemicsClaim
const getCustomerMock = require('../../../../app/session').getCustomer

jest.mock('../../../../app/event/raise-event')
jest.mock('../../../../app/session')

const request = { yar: { id: '123' } }
const reference = '321321'
const sbi = 'sbi'
const email = 'email'
const sessionKey = 'sessionKey'
const exception = 'exception'
const crn = 'crn'
const newDate = new Date()
const event = {
  id: request.yar.id,
  sbi,
  cph: 'n/a',
  email,
  name: 'send-invalid-data-event',
  type: 'claim-sessionKey-invalid',
  message: `${sessionKey}: ${exception}`,
  data: {
    sbi,
    crn,
    sessionKey,
    exception,
    raisedAt: newDate,
    journey: 'claim',
    reference
  },
  status: 'alert'
}

describe('Send event on raise invalid data event', () => {
  beforeEach(async () => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(newDate)
    getEndemicsClaimMock.mockImplementation(() => { return { reference, organisation: { sbi, email } } })
    getCustomerMock.mockImplementation(() => { return crn })
  })

  afterEach(async () => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await raiseInvalidDataEvent(request, sessionKey, exception)
    expect(raiseEvent).toHaveBeenCalledWith(event, 'alert')
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await raiseInvalidDataEvent({ yar: { id: undefined } }, sessionKey, exception)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null exception is received', async () => {
    await raiseInvalidDataEvent(request, sessionKey, undefined)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
