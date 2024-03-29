const raiseEvent = require('./raise-event')

const sendSessionEvent = async (claim, sessionId, entryKey, key, value, ip, status = 'success') => {
  const { organisation, reference } = claim
  if (sessionId && organisation) {
    const event = {
      id: sessionId,
      sbi: organisation.sbi,
      cph: 'n/a',
      reference,
      email: organisation.email,
      name: 'send-session-event',
      type: `${entryKey}-${key}`,
      message: `Session set for ${entryKey} and ${key}.`,
      data: { reference, [key]: value },
      ip
    }
    await raiseEvent(event, status)
  }
}

module.exports = sendSessionEvent
