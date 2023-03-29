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
  const tokenResponse = await redeemAuthorizationCodeForAccessToken(request)
  if (typeof tokenResponse === 'undefined') {
    throw new Error('Code redemption failed')
  }
  const verified = await jwtVerify(tokenResponse.access_token)
  if (!verified) {
    throw new Error('Invalid access token')
  }

  const accessToken = jwtDecode(tokenResponse.access_token)
  const idToken = jwtDecode(tokenResponse.id_token)

  if (!jwtVerifyIss(accessToken.iss)) {
    throw new Error('Invalid iss')
  }
  if (!nonce.verify(request, idToken)) {
    throw new Error('Invalid nonce')
  }

  session.setToken(request, sessionKeys.tokens.accessToken, tokenResponse.access_token)
  session.setToken(request, sessionKeys.tokens.tokenExpiry, expiresIn.toISOString(tokenResponse.expires_in))
  session.setCustomer(request, sessionKeys.customer.crn, accessToken.contactId)
  session.setCustomer(request, sessionKeys.customer.organisationId, accessToken.currentRelationshipId)

  cookieAuth.set(request, accessToken)

  return accessToken
}

module.exports = authenticate
