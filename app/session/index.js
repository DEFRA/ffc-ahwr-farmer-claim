const { sendSessionEvent } = require('../event')

const entries = {
  application: 'application',
  claim: 'claim',
  endemicsClaim: 'endemicsClaim',
  organisation: 'organisation',
  pkcecodes: 'pkcecodes',
  tokens: 'tokens',
  customer: 'customer'
}

function set (request, entryKey, key, value, status, endemics = false) {
  const entryValue = request.yar?.get(entryKey) || {}
  entryValue[key] = typeof value === 'string' ? value.trim() : value
  request.yar.set(entryKey, entryValue)
  const claim = endemics ? getEndemicsClaim(request) : getClaim(request)
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
}

function getApplication (request, key) {
  return get(request, entries.application, key)
}

function setApplication (request, key, value) {
  set(request, entries.application, key, value)
}

function setClaim (request, key, value, status) {
  set(request, entries.claim, key, value, status)
}

function getClaim (request, key) {
  return get(request, entries.claim, key)
}

function setEndemicsClaim (request, key, value, status) {
  set(request, entries.endemicsClaim, key, value, status, true)
}

function getEndemicsClaim (request, key) {
  return get(request, entries.endemicsClaim, key)
}

function clearEndemicsClaim (request) { // Remove all journey related data
  const endemicsClaim = getEndemicsClaim(request)
  request.yar.clear(entries.endemicsClaim)
  setEndemicsClaim(request, 'organisation', endemicsClaim?.organisation)
  setEndemicsClaim(request, 'reference', endemicsClaim?.reference)
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
  getApplication,
  setApplication,
  getClaim,
  setClaim,
  getEndemicsClaim,
  setEndemicsClaim,
  clearEndemicsClaim,
  clear,
  getToken,
  setToken,
  getCustomer,
  setCustomer,
  getPkcecodes,
  setPkcecodes
}
