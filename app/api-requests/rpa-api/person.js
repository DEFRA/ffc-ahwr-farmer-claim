const { get } = require('./base')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const config = require('../../config')
const jwtDecode = require('../../auth/token-verify/jwt-decode')
const hostname = config.authConfig.ruralPaymentsAgency.hostname

// This URL contains a hardcoded personId value (3337243) which has been confirmed by
// Version One - "We will be using a static "3337243" value as the personId parameter."
const getPersonSummaryUrl = config.authConfig.ruralPaymentsAgency.getPersonSummaryUrl

function getPersonName (personSummary) {
  return [personSummary.firstName, personSummary.middleName, personSummary.lastName].filter(Boolean).join(' ')
}

function parsedAccessToken (request) {
  const accessToken = session.getToken(request, tokens.accessToken)
  return jwtDecode(accessToken)
}

const getPersonSummary = async (request, apimAccessToken) => {
  const crn = parsedAccessToken(request).contactId
  const response = await get(hostname, getPersonSummaryUrl, request, { crn, Authorization: apimAccessToken })
  return response._data
}

module.exports = {
  getPersonSummary,
  getPersonName
}
