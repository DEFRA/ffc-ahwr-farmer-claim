const state = require('./auth-code-grant/state')
const redeemAuthorizationCodeForAccessToken = require('./auth-code-grant/redeem-authorization-code-for-access-token')
const jwtVerify = require('./token-verify/jwt-verify')
const jwtDecode = require('./token-verify/jwt-decode')
const jwtVerifyIss = require('./token-verify/jwt-verify-iss')
const nonce = require('./id-token/nonce')
const expiresIn = require('./auth-code-grant/expires-in')
const session = require('../session')
const sessionKeys = require('../session/keys')
const cookieAuth = require('./cookie-auth/cookie-auth')
const { InvalidStateError } = require('../exceptions')

const authenticate = async (request) => {
  if (!state.verify(request)) {
    throw new InvalidStateError('Invalid state')
  }
  const redeemResponse = await redeemAuthorizationCodeForAccessToken(request)
  await jwtVerify(redeemResponse.access_token)
  const accessToken = jwtDecode(redeemResponse.access_token)
  const idToken = jwtDecode(redeemResponse.id_token)
  await jwtVerifyIss(accessToken.iss)
  nonce.verify(request, idToken)

  session.setToken(request, sessionKeys.tokens.accessToken, redeemResponse.access_token)
  session.setToken(request, sessionKeys.tokens.tokenExpiry, expiresIn.toISOString(redeemResponse.expires_in))
  session.setCustomer(request, sessionKeys.customer.crn, accessToken.contactId)
  session.setCustomer(request, sessionKeys.customer.organisationId, accessToken.currentRelationshipId)
  session.setCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses, typeof accessToken.enrolmentCount !== 'undefined' && accessToken.enrolmentCount > 1)

  cookieAuth.set(request, accessToken)

  return accessToken
}

module.exports = authenticate
