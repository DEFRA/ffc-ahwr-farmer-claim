
const config = require('../config')
const { createCryptoProvider } = require('./crypto')
const { generateNonce, generateState } = require('./verification')

const lookupToken = async (request, token) => {
  const { magiclinkCache } = request.server.app
  return (await magiclinkCache.get(token)) ?? {}
}

const setAuthCookie = (request, email, userType) => {
  request.cookieAuth.set({ email, userType })
  console.log(`Logged in user of type '${userType}' with email '${email}'.`)
}

const clearAuthCookie = (request) => {
  request.cookieAuth.clear()
  console.log('Auth cookie cleared.')
}

const getAuthenticationUrl = (session, request, pkce = true) => {
  const authUrl = new URL(`${config.authConfig.defraId.hostname}${config.authConfig.defraId.oAuthAuthorisePath}`)
  authUrl.searchParams.append('p', config.authConfig.defraId.policy)
  authUrl.searchParams.append('client_id', config.authConfig.defraId.clientId)
  authUrl.searchParams.append('nonce', generateNonce(session, request))
  authUrl.searchParams.append('redirect_uri', config.authConfig.defraId.redirectUri)
  authUrl.searchParams.append('scope', config.authConfig.defraId.scope)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('serviceId', config.authConfig.defraId.serviceId)
  authUrl.searchParams.append('state', generateState(session, request))
  authUrl.searchParams.append('forceReselection', true)

  if (pkce) {
    const challenge = createCryptoProvider(session, request)
    authUrl.searchParams.append('code_challenge', challenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
  }

  return authUrl
}

module.exports = {
  clearAuthCookie,
  lookupToken,
  setAuthCookie,
  getAuthenticationUrl
}
