const { lookupClientCredentialToken, clientCredentialsValid } = require('./utils')
const refreshClientCredentialToken = require('./refresh-client-credential-token')

const getClientCredentials = async (request) => {
  let accessToken
  console.log(`${new Date().toISOString()} Retrieving client credentials from cache`)
  try {
    const clientCredentials = await lookupClientCredentialToken(request)
    if (!clientCredentialsValid(clientCredentials)) {
      console.log(`${new Date().toISOString()} No valid cached credentials, so retrieving from APIM host`)
      accessToken = await refreshClientCredentialToken(request)
    } else {
      accessToken = `${clientCredentials.token.token_type} ${clientCredentials.token.access_token}`
    }

    return accessToken
  } catch (error) {
    console.log(`${new Date().toISOString()} Error getting client credentials: ${JSON.stringify(error.message)}`)
    console.error(error)
    throw error
  }
}

module.exports = getClientCredentials
