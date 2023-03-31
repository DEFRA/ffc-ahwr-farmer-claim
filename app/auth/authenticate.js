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

const authenticate = async (request) => {
  if (!state.verify(request)) {
    throw new Error('Invalid state')
  }
  const redeemResponse = await redeemAuthorizationCodeForAccessToken(request)
  if (typeof redeemResponse === 'undefined') {
    throw new Error('Code redemption failed')
  }

  await jwtVerify(redeemResponse.access_token)

  const accessToken = jwtDecode(redeemResponse.access_token)
  const idToken = jwtDecode(redeemResponse.id_token)

  await jwtVerifyIss(accessToken.iss)

  if (!nonce.verify(request, idToken)) {
    throw new Error('Invalid nonce')
  }

  session.setToken(request, sessionKeys.tokens.accessToken, redeemResponse.access_token)
  session.setToken(request, sessionKeys.tokens.tokenExpiry, expiresIn.toISOString(redeemResponse.expires_in))
  session.setCustomer(request, sessionKeys.customer.crn, accessToken.contactId)
  session.setCustomer(request, sessionKeys.customer.organisationId, accessToken.currentRelationshipId)

  cookieAuth.set(request, accessToken)

  return accessToken
}

module.exports = authenticate
