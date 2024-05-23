const raiseEvent = require('./raise-event')

const renameSessionKeysForEventReporting = (key) => {
  switch (key) {
    case 'laboratoryURN': {
      key = 'urnResult'
      break
    }
    case 'vetsName': {
      key = 'vetName'
      break
    }
    case 'vetsRCVSNumber': {
      key = 'vetRcvs'
      break
    }
    case 'dateOfVisit': {
      key = 'visitDate'
      break
    }
  }
  return key
}
const renameClaimEntryKeyForEventReporting = (entryKey) => entryKey === 'endemicsClaim' ? 'claim' : entryKey

const sendSessionEvent = async (claim, sessionId, entryKey, key, value, ip, status = 'success') => {
  key = renameSessionKeysForEventReporting(key)
  entryKey = renameClaimEntryKeyForEventReporting(entryKey)

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
