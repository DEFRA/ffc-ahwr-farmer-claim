import { getIpFromRequest } from '../event/get-ip-from-request.js'
import { sendSessionEvent } from '../event/send-session-event.js'
import { sessionKeys } from '../session/keys.js'

const entries = {
  application: 'application',
  claim: 'claim',
  endemicsClaim: 'endemicsClaim',
  organisation: 'organisation',
  pkcecodes: 'pkcecodes',
  tokens: 'tokens',
  customer: 'customer',
  tempClaimReference: 'tempClaimReference'
}

const {
  endemicsClaim: {
    tempHerdId: tempHerdIdKey,
    herdId: herdIdKey,
    herdName: herdNameKey,
    herdCph: herdCphKey,
    herdOthersOnSbi: herdOthersOnSbiKey,
    herdReasons: herdReasonsKey,
    herdSame: herdSameKey
  }
} = sessionKeys

function set (request, entryKey, key, value, shouldEmitEvent) {
  const entryValue = request.yar?.get(entryKey) || {}
  entryValue[key] = typeof value === 'string' ? value.trim() : value
  request.yar.set(entryKey, entryValue)
  const claim = getEndemicsClaim(request)
  const ip = getIpFromRequest(request)
  claim && shouldEmitEvent &&
    sendSessionEvent(
      claim,
      request.yar.id,
      entryKey,
      key,
      value,
      ip
    )
}

function get (request, entryKey, key) {
  return key ? request.yar?.get(entryKey)?.[key] : request.yar?.get(entryKey)
}

export function clear (request) {
  request.yar.clear(entries.claim)
  request.yar.clear(entries.endemicsClaim)
  request.yar.clear(entries.application)
  request.yar.clear(entries.organisation)
  request.yar.clear(entries.tempClaimReference)
}

export function setClaim (request, key, value) {
  set(request, entries.claim, key, value)
}

export function getClaim (request, key) {
  return get(request, entries.claim, key)
}

export function setEndemicsClaim (request, key, value, { shouldEmitEvent } = { shouldEmitEvent: true }) {
  set(request, entries.endemicsClaim, key, value, shouldEmitEvent)
}

export function getEndemicsClaim (request, key) {
  return get(request, entries.endemicsClaim, key)
}

export function clearEndemicsClaim (request) {
  const endemicsClaim = getEndemicsClaim(request)
  request.yar.clear(entries.endemicsClaim)
  setEndemicsClaim(request, 'organisation', endemicsClaim?.organisation)
  setEndemicsClaim(request, 'latestVetVisitApplication', endemicsClaim?.latestVetVisitApplication)
  setEndemicsClaim(request, 'latestEndemicsApplication', endemicsClaim?.latestEndemicsApplication)
  removeMultipleHerdsSessionData(request, endemicsClaim)
}

export const removeMultipleHerdsSessionData = (request, sessionEndemicsClaim) => {
  sessionEndemicsClaim.tempHerdId && setEndemicsClaim(request, tempHerdIdKey, undefined, { shouldEmitEvent: false })
  removeHerdSessionData(request, sessionEndemicsClaim)
}

export const removeHerdSessionData = (request, sessionEndemicsClaim) => {
  sessionEndemicsClaim.herdId && setEndemicsClaim(request, herdIdKey, undefined, { shouldEmitEvent: false })
  sessionEndemicsClaim.herdName && setEndemicsClaim(request, herdNameKey, undefined, { shouldEmitEvent: false })
  sessionEndemicsClaim.herdCph && setEndemicsClaim(request, herdCphKey, undefined, { shouldEmitEvent: false })
  sessionEndemicsClaim.herdOthersOnSbi && setEndemicsClaim(request, herdOthersOnSbiKey, undefined, { shouldEmitEvent: false })
  sessionEndemicsClaim.herdReasons && setEndemicsClaim(request, herdReasonsKey, undefined, { shouldEmitEvent: false })
  sessionEndemicsClaim.herdSame && setEndemicsClaim(request, herdSameKey, undefined, { shouldEmitEvent: false })
}

export function setTempClaimReference (request, key, value) {
  set(request, entries.tempClaimReference, key, value)
}

export function setToken (request, key, value) {
  set(request, entries.tokens, key, value)
}

export function getToken (request, key) {
  return get(request, entries.tokens, key)
}

export function setCustomer (request, key, value) {
  set(request, entries.customer, key, value)
}

export function getCustomer (request, key) {
  return get(request, entries.customer, key)
}

export function setPkcecodes (request, key, value) {
  set(request, entries.pkcecodes, key, value)
}

export function getPkcecodes (request, key) {
  return get(request, entries.pkcecodes, key)
}
