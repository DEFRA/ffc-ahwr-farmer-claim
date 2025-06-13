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
    organisation: organisationKey,
    latestVetVisitApplication: latestVetVisitApplicationKey,
    latestEndemicsApplication: latestEndemicsApplicationKey,
    previousClaims: previousClaimsKey,
    reference: referenceKey,
    typeOfLivestock: typeOfLivestockKey,
    typeOfReview: typeOfReviewKey,
    dateOfVisit: dateOfVisitKey,
    tempHerdId: tempHerdIdKey,
    unnamedHerdId: unnamedHerdIdKey,
    herds: herdsKey,
    herdId: herdIdKey,
    herdVersion: herdVersionKey,
    herdName: herdNameKey,
    herdCph: herdCphKey,
    herdOthersOnSbi: herdOthersOnSbiKey,
    herdReasons: herdReasonsKey,
    herdSame: herdSameKey,
    vetVisitsReviewTestResults: vetVisitsReviewTestResultsKey
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
  setEndemicsClaim(request, organisationKey, endemicsClaim?.organisation)
  setEndemicsClaim(request, latestVetVisitApplicationKey, endemicsClaim?.latestVetVisitApplication)
  setEndemicsClaim(request, latestEndemicsApplicationKey, endemicsClaim?.latestEndemicsApplication)
}

export function removeSessionDataForSelectHerdChange (request) {
  const endemicsClaim = getEndemicsClaim(request)

  request.yar.clear(entries.endemicsClaim)

  setEndemicsClaim(request, organisationKey, endemicsClaim?.organisation, { shouldEmitEvent: false })
  setEndemicsClaim(request, latestVetVisitApplicationKey, endemicsClaim?.latestVetVisitApplication, { shouldEmitEvent: false })
  setEndemicsClaim(request, latestEndemicsApplicationKey, endemicsClaim?.latestEndemicsApplication, { shouldEmitEvent: false })
  setEndemicsClaim(request, previousClaimsKey, endemicsClaim?.previousClaims, { shouldEmitEvent: false })
  setEndemicsClaim(request, referenceKey, endemicsClaim?.reference, { shouldEmitEvent: false })

  setEndemicsClaim(request, typeOfLivestockKey, endemicsClaim?.typeOfLivestock, { shouldEmitEvent: false })
  setEndemicsClaim(request, typeOfReviewKey, endemicsClaim?.typeOfReview, { shouldEmitEvent: false })
  setEndemicsClaim(request, dateOfVisitKey, endemicsClaim?.dateOfVisit, { shouldEmitEvent: false })
  setEndemicsClaim(request, tempHerdIdKey, endemicsClaim?.tempHerdId, { shouldEmitEvent: false })
  setEndemicsClaim(request, unnamedHerdIdKey, endemicsClaim?.unnamedHerdId, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdsKey, endemicsClaim?.herds, { shouldEmitEvent: false })

  setEndemicsClaim(request, vetVisitsReviewTestResultsKey, endemicsClaim?.vetVisitsReviewTestResults, { shouldEmitEvent: false })
}

export function removeSessionDataForSameHerdChange (request) {
  removeSessionDataForSelectHerdChange(request)
  const endemicsClaim = getEndemicsClaim(request)

  setEndemicsClaim(request, herdIdKey, endemicsClaim?.herdId, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdVersionKey, endemicsClaim?.herdVersion, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdNameKey, endemicsClaim?.herdName, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdCphKey, endemicsClaim?.herdCph, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdOthersOnSbiKey, endemicsClaim?.herdOthersOnSbi, { shouldEmitEvent: false })
  setEndemicsClaim(request, herdReasonsKey, endemicsClaim?.herdReasons, { shouldEmitEvent: false })
}

export const removeMultipleHerdsSessionData = (request, sessionEndemicsClaim) => {
  sessionEndemicsClaim.tempHerdId && setEndemicsClaim(request, tempHerdIdKey, undefined, { shouldEmitEvent: false })
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
