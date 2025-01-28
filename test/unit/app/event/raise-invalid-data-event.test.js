const raiseEvent = require('../../../../app/event/raise-event')
const raiseInvalidDataEvent = require('../../../../app/event/raise-invalid-data-event')
const { getEndemicsClaim: getEndemicsClaimMock, getApplication: getApplicationMock, getOrganisation: getOrganisationMock } = require('../../../../app/session')
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
    reference,
    applicationReference: '12345'
  },
  status: 'alert'
}

describe('Send event on raise invalid data event', () => {
  beforeEach(async () => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(newDate)
    getEndemicsClaimMock.mockImplementation(() => ({ reference }))
    getOrganisationMock.mockImplementation(() => ({ sbi, email }))
    getApplicationMock.mockImplementation(() => ({ latestEndemicsApplication: { reference: '12345' } }))
    getCustomerMock.mockImplementation(() => crn)
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
