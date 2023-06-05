const raiseEvent = require('./raise-event')

const sendExceptionEvent = async (sessionId, sbi, crn, email, exception, status = 'alert') => {
  if (sessionId && exception) {
    const event = {
      id: sessionId,
      sbi: `${sbi}`,
      cph: 'n/a',
      email,
      name: 'send-exception-event',
      type: 'exception-event',
      message: `Claim: ${exception}`,
      data: {
        sbi,
        crn,
        exception,
        raisedAt: new Date(),
        journey: 'claim'
      },
      status
    }
    await raiseEvent(event, status)
    console.log(`Event raised: ${JSON.stringify(event)}`)
  }
}

module.exports = sendExceptionEvent
