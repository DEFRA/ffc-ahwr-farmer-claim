const wreck = require('@hapi/wreck')
const FormData = require('form-data')
const config = require('../../config')

const retrieveApimAccessToken = async () => {
  console.log(`${new Date().toISOString()} Requesting an access token for APIM: ${JSON.stringify(`${config.authConfig.apim.hostname}${config.authConfig.apim.oAuthPath}`)}`)
  try {
    const uri = `${config.authConfig.apim.hostname}${config.authConfig.apim.oAuthPath}`
    const data = new FormData()
    data.append('client_id', `${config.authConfig.apim.clientId}`)
    data.append('client_secret', `${config.authConfig.apim.clientSecret}`)
    data.append('scope', `${config.authConfig.apim.scope}`)
    data.append('grant_type', 'client_credentials')

    const response = await wreck.post(
      uri,
      {
        headers: data.getHeaders(),
        payload: data,
        json: true,
        timeout: config.wreckHttp.timeoutMilliseconds
      }
    )
    console.log(`${new Date().toISOString()} Response status code from APIM access token request: ${JSON.stringify(response.res.statusCode)}`)
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }

    return `${response?.payload.token_type} ${response?.payload.access_token}`
  } catch (error) {
    console.log(`${new Date().toISOString()} Response message received from APIM access token request: ${JSON.stringify(error.message)}`)
    console.error(error)
    throw error
  }
}

module.exports = retrieveApimAccessToken
