const { getEndemicsClaim, getCustomer } = require('../session')
const raiseEvent = require('./raise-event')
const sessionKeys = require('../session/keys')

const raiseInvalidDataEvent = async (request, sessionKey, exception) => {
  const { yar: id } = request
  const { reference, organisation: { sbi, email } } = getEndemicsClaim(request)
  const crn = getCustomer(request, sessionKeys.customer.crn)

  if (id && exception) {
    const event = {
      id,
      sbi: `${sbi}`,
      cph: 'n/a',
      email,
      name: 'send-invalid-data-event',
      type: 'invalid-data-event',
      message: `${sessionKey}: ${exception}`,
      data: {
        sbi,
        crn,
        sessionKey,
        exception,
        raisedAt: new Date(),
        journey: 'claim',
        reference
      },
      status: 'alert'
    }
    await raiseEvent(event, 'alert')
  }
}

module.exports = raiseInvalidDataEvent
