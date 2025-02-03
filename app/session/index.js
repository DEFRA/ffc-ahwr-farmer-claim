const { sendSessionEvent } = require('../event')

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

function set (request, entryKey, key, value, status) {
  const entryValue = request.yar?.get(entryKey) || {}
  entryValue[key] = typeof value === 'string' ? value.trim() : value
  request.yar.set(entryKey, entryValue)
  const claim = getEndemicsClaim(request)
  const xForwardedForHeader = request.headers['x-forwarded-for']
  const ip = xForwardedForHeader
    ? xForwardedForHeader.split(',')[0]
    : request.info.remoteAddress
  claim &&
    sendSessionEvent(
      claim,
      request.yar.id,
      entryKey,
      key,
      value,
      ip,
      status
    )
}

function get (request, entryKey, key) {
  return key ? request.yar?.get(entryKey)?.[key] : request.yar?.get(entryKey)
}

function clear (request) {
  request.yar.clear(entries.claim)
  request.yar.clear(entries.endemicsClaim)
  request.yar.clear(entries.application)
  request.yar.clear(entries.organisation)
  request.yar.clear(entries.tempClaimReference)
}

function setClaim (request, key, value, status) {
  set(request, entries.claim, key, value, status)
}

function getClaim (request, key) {
  return get(request, entries.claim, key)
}

function setEndemicsClaim (request, key, value, status) {
  set(request, entries.endemicsClaim, key, value, status)
}

function getEndemicsClaim (request, key) {
  return get(request, entries.endemicsClaim, key)
}

function clearEndemicsClaim (request) {
  const endemicsClaim = getEndemicsClaim(request)
  request.yar.clear(entries.endemicsClaim)
  setEndemicsClaim(request, 'organisation', endemicsClaim?.organisation)
  setEndemicsClaim(request, 'latestVetVisitApplication', endemicsClaim?.latestVetVisitApplication)
  setEndemicsClaim(request, 'latestEndemicsApplication', endemicsClaim?.latestEndemicsApplication)
}

function setTempClaimReference (request, key, value, status) {
  set(request, entries.tempClaimReference, key, value, status)
}

function setToken (request, key, value) {
  set(request, entries.tokens, key, value)
}

function getToken (request, key) {
  return get(request, entries.tokens, key)
}

function setCustomer (request, key, value) {
  set(request, entries.customer, key, value)
}

function getCustomer (request, key) {
  return get(request, entries.customer, key)
}

function setPkcecodes (request, key, value) {
  set(request, entries.pkcecodes, key, value)
}

function getPkcecodes (request, key) {
  return get(request, entries.pkcecodes, key)
}

module.exports = {
  getClaim,
  setClaim,
  getEndemicsClaim,
  setEndemicsClaim,
  clearEndemicsClaim,
  clear,
  setTempClaimReference,
  getToken,
  setToken,
  getCustomer,
  setCustomer,
  getPkcecodes,
  setPkcecodes
}
