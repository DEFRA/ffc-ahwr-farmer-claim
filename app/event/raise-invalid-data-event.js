const { getEndemicsClaim, getCustomer } = require('../session')
const raiseEvent = require('./raise-event')
const sessionKeys = require('../session/keys')

const raiseInvalidDataEvent = async (request, sessionKey, exception) => {
  const { reference, organisation, latestEndemicsApplication: { reference: applicationReference } = {} } = getEndemicsClaim(request)
  const crn = getCustomer(request, sessionKeys.customer.crn)

  if (request?.yar?.id && exception) {
    const event = {
      id: request.yar.id,
      sbi: organisation?.sbi,
      cph: 'n/a',
      email: organisation?.email,
      name: 'send-invalid-data-event',
      type: `claim-${sessionKey}-invalid`,
      message: `${sessionKey}: ${exception}`,
      data: {
        sbi: organisation?.sbi,
        crn,
        sessionKey,
        exception,
        raisedAt: new Date(),
        journey: 'claim',
        reference,
        applicationReference
      },
      status: 'alert'
    }
    await raiseEvent(event, 'alert')
  }
}

module.exports = raiseInvalidDataEvent
