const raiseEvent = require('./raise-event')

const sendExceptionEvent = async (sessionId, sbi, crn, exception, status = 'alert') => {
  if (sessionId && exception) {
    const event = {
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
        raisedAt: new Date(),
        journey: 'apply'
      },
      status
    }
    await raiseEvent(event, status)
  }
}

module.exports = sendExceptionEvent
