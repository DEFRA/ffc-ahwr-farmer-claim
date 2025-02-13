import { raiseEvent } from './raise-event.js'

export const raiseIneligibilityEvent = async (sessionId, sbi, crn, email, exception, reference = '', status = 'alert') => {
  if (sessionId && exception) {
    const event = {
      id: sessionId,
      sbi: `${sbi}`,
      cph: 'n/a',
      email,
      name: 'send-ineligibility-event',
      type: 'ineligibility-event',
      message: `Claim: ${exception}`,
      data: {
        sbi,
        crn,
        exception,
        raisedAt: new Date(),
        journey: 'claim',
        reference
      },
      status
    }
    await raiseEvent(event, status)
    event.name = 'send-session-event'
    await raiseEvent(event, status)
  }
}
