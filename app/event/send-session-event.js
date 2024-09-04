const raiseEvent = require('./raise-event')

// This has been done to keep consistent with old journey.
// Should look at refactoring this for best name options.
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
    case 'vetRCVSNumber': {
      key = 'vetRcvs'
      break
    }
    case 'dateOfVisit': {
      key = 'visitDate'
      break
    }
    case 'numberAnimalsTested': {
      key = 'animalsTested'
      break
    }
  }
  return key
}
const renameClaimEntryKeyForEventReporting = (entryKey) => entryKey === 'endemicsClaim' ? 'claim' : entryKey

const sendSessionEvent = async (claim, sessionId, entryKey, key, value, ip, status = 'success') => {
  key = renameSessionKeysForEventReporting(key)
  entryKey = renameClaimEntryKeyForEventReporting(entryKey)

  const { organisation, reference, latestEndemicsApplication: { reference: applicationReference } = {} } = claim

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
      data: { reference, applicationReference, [key]: value },
      ip
    }
    await raiseEvent(event, status)
  }
}

module.exports = sendSessionEvent
