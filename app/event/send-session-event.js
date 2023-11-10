const raiseEvent = require('./raise-event')

const sendSessionEvent = async (organisation, reference, sessionId, entryKey, key, value, ip) => {
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
    await raiseEvent(event)
  }
}

module.exports = sendSessionEvent
