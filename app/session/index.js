const { sendSessionEvent } = require('../event')

const entries = {
  application: 'application',
  claim: 'claim',
  organisation: 'organisation',
  selectYourBusiness: 'selectYourBusiness',
  pkcecodes: 'pkcecodes',
  tokens: 'tokens'
}

function set (request, entryKey, key, value) {
  const entryValue = request.yar?.get(entryKey) || {}
  entryValue[key] = typeof (value) === 'string' ? value.trim() : value
  request.yar.set(entryKey, entryValue)
  const claim = getClaim(request)
  const xForwardedForHeader = request.headers['x-forwarded-for']
  const ip = xForwardedForHeader ? xForwardedForHeader.split(',')[0] : request.info.remoteAddress
  claim && sendSessionEvent(claim.organisation, request.yar.id, entryKey, key, value, ip)
}

function get (request, entryKey, key) {
  return key ? request.yar?.get(entryKey)?.[key] : request.yar?.get(entryKey)
}

function clear (request) {
  request.yar.clear(entries.claim)
  request.yar.clear(entries.application)
  request.yar.clear(entries.organisation)
  request.yar.clear(entries.selectYourBusiness)
}

function setApplication (request, key, value) {
  set(request, entries.application, key, value)
}

function setClaim (request, key, value) {
  set(request, entries.claim, key, value)
}

function getApplication (request, key) {
  return get(request, entries.application, key)
}

function getClaim (request, key) {
  return get(request, entries.claim, key)
}

function setSelectYourBusiness (request, key, value) {
  set(request, entries.selectYourBusiness, key, value)
}

function getSelectYourBusiness (request, key) {
  return get(request, entries.selectYourBusiness, key)
}

function setToken (request, key, value) {
  set(request, entries.tokens, key, value)
}

function getToken (request, key) {
  return get(request, entries.tokens, key)
}

function setPkcecodes (request, key, value) {
  set(request, entries.pkcecodes, key, value)
}

function getPkcecodes (request, key) {
  return get(request, entries.pkcecodes, key)
}

module.exports = {
  getApplication,
  getClaim,
  setApplication,
  setClaim,
  clear,
  setSelectYourBusiness,
  getSelectYourBusiness,
  getToken,
  setToken,
  getPkcecodes,
  setPkcecodes
}
