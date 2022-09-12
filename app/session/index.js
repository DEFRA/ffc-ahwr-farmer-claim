const entries = {
  application: 'application',
  claim: 'claim',
  organisation: 'organisation',
  speciesData: 'speciesData'
}

function set (request, entryKey, key, value) {
  const entryValue = request.yar?.get(entryKey) || {}
  entryValue[key] = typeof (value) === 'string' ? value.trim() : value
  request.yar.set(entryKey, entryValue)
}

function get (request, entryKey, key) {
  return key ? request.yar?.get(entryKey)?.[key] : request.yar?.get(entryKey)
}

function clear (request) {
  request.yar.clear(entries.claim)
  request.yar.clear(entries.application)
  request.yar.clear(entries.organisation)
}

function setApplication (request, key, value) {
  set(request, entries.application, key, value)
}
function setFullApplication (request,  value) {
  request.yar.set('farmerApplyData', value)
}
function setClaim (request, key, value) {
  set(request, entries.claim, key, value)
}

function setSpecies (request, key, value) {
  set(request, entries.speciesData, key, value)
}

function getApplication (request, key) {
  return get(request, entries.application, key)
}

function getClaim (request, key) {
  return get(request, entries.claim, key)
}

function getSpecies (request, key) {
  return get(request, entries.speciesData, key)
}

module.exports = {
  getApplication,
  getClaim,
  getSpecies,
  setApplication,
  setClaim,
  setFullApplication,
  setSpecies,
  clear
}
