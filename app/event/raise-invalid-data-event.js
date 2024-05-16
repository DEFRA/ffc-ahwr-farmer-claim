const { getEndemicsClaim, getCustomer } = require('../session')
const raiseEvent = require('./raise-event')
const sessionKeys = require('../session/keys')

const raiseInvalidDataEvent = async (request, sessionKey, exception) => {
  const { reference, organisation: { sbi, email } } = getEndemicsClaim(request)
  const crn = getCustomer(request, sessionKeys.customer.crn)

  if (request?.yar?.id && exception) {
    const event = {
      id: request.yar.id,
      sbi,
      cph: 'n/a',
      email,
      name: 'send-invalid-data-event',
      type: `claim-${sessionKey}-invalid-data-entered`,
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
