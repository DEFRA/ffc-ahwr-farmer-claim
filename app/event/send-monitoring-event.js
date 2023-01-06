const raiseEvent = require('./raise-event')

const sendMonitoringEvent = async (sessionId, alert, email, ip, status = 'alert') => {
  if (sessionId) {
    const event = {
      id: sessionId,
      sbi: 'n/a',
      cph: 'n/a',
      email: email ?? 'unknown',
      name: 'send-monitoring-event',
      type: 'monitoring-magic-link',
      message: 'Monitoring magic link.',
      ip,
      data: { alert }
    }
    await raiseEvent(event, status)
  }
}

module.exports = sendMonitoringEvent
