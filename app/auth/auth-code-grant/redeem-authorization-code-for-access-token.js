const Wreck = require('@hapi/wreck')
const FormData = require('form-data')
const config = require('../../config')
const session = require('../../session')
const sessionKeys = require('../../session/keys')

const redeemAuthorizationCodeForAccessToken = async (request) => {
  console.log(`${new Date().toISOString()} Requesting an access token with a client_secret`)
  try {
    const data = new FormData()
    // The Application (client) ID
    data.append('client_id', config.authConfig.defraId.clientId)
    data.append('client_secret', config.authConfig.defraId.clientSecret)
    // Allow apps to declare the resource they want the token for during token redemption.
    data.append('scope', config.authConfig.defraId.scope)
    // The authorization_code that you acquired in the first leg of the flow.
    data.append('code', request.query.code)
    // Must be authorization_code for the authorization code flow.
    data.append('grant_type', 'authorization_code')
    // The same redirect_uri value that was used to acquire the authorization_code.
    data.append('redirect_uri', config.authConfig.defraId.redirectUri)
    // The same code_verifier that was used to obtain the authorization_code.
    data.append('code_verifier', session.getPkcecodes(request, sessionKeys.pkcecodes.verifier))
    const response = await Wreck.post(
      `${config.authConfig.defraId.hostname}/${config.authConfig.defraId.policy}/oauth2/v2.0/token`,
      {
        headers: data.getHeaders(),
        payload: data,
        json: true
      }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.log(`${new Date().toISOString()} Error while requesting an access token: ${error.message}`)
    console.error(error)
    throw error
  }
}

module.exports = redeemAuthorizationCodeForAccessToken
